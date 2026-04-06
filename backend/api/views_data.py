import csv
import io
import uuid
from decimal import Decimal
from django.db import transaction
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from inventory.models import Supplier, InventoryItem, InventoryStock

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_csv(request):
    """
    Accepts a single CSV file upload.
    Adds quantity to existing stock rather than overwriting.
    """
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    csv_file = request.FILES['file']
    if not csv_file.name.endswith('.csv'):
        return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        # Use DictReader to easily access columns regardless of order
        reader = csv.DictReader(io_string)
        
        # We want to lowercase and strip headers to be forgiving
        if reader.fieldnames:
            reader.fieldnames = [str(f).strip().lower() for f in reader.fieldnames]
    except Exception as e:
        return Response({"error": f"Error reading CSV format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    rows_processed = 0
    items_created = 0
    items_updated = 0
    errors = []

    required_columns = {'item_id', 'item_name', 'quantity'}
    if not reader.fieldnames or not required_columns.issubset(set(reader.fieldnames)):
        missing = required_columns - set(reader.fieldnames or [])
        return Response(
            {"error": f"Missing required columns in CSV: {', '.join(missing)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():
        for row_idx, row in enumerate(reader, start=1):
            try:
                # ── Strip whitespace from all values
                row = {k: str(v).strip() if v else '' for k, v in row.items()}
                
                item_id = row.get('item_id')
                item_name = row.get('item_name')
                qty_str = row.get('quantity', '0')
                
                if not item_id or not item_name:
                    errors.append(f"Row {row_idx}: Missing item_id or item_name")
                    continue

                try:
                    qty = Decimal(qty_str)
                except:
                    qty = Decimal('0')

                # ── Supplier Handling
                supplier_name = row.get('supplier_name') or 'Default Supplier'
                supplier, sup_created = Supplier.objects.get_or_create(
                    supplier_name=supplier_name,
                    defaults={'supplier_id': f"SUP-{uuid.uuid4().hex[:6]}"}
                )

                # ── Item Handling
                item, item_created = InventoryItem.objects.get_or_create(
                    item_id=item_id,
                    defaults={
                        'item_name': item_name,
                        'category': row.get('category', 'Uncategorized'),
                        'unit': row.get('unit', 'units'),
                        'supplier': supplier,
                        'cost_per_unit': Decimal(row.get('cost_per_unit', '0') or '0')
                    }
                )

                # If item already existed, we still might want to update some fields if provided,
                # but instruction is primary about STOCK additions. We'll leave item data alone 
                # to not accidentally wipe existing costs, unless strictly required.

                # ── Stock Handling
                reorder_lvl = Decimal(row.get('reorder_level', '20') or '20')
                
                stock, stock_created = InventoryStock.objects.get_or_create(
                    item=item,
                    defaults={
                        'stock_id': f"STK-{item_id}",
                        'quantity_available': qty,
                        'reorder_level': reorder_lvl
                    }
                )

                if not stock_created:
                    # Item exists! We ADD to existing quantity instead of overwriting
                    stock.quantity_available += qty
                    # update reorder level only if the CSV explicitly provided a new one
                    if row.get('reorder_level'):
                        stock.reorder_level = reorder_lvl
                    stock.save()
                    items_updated += 1
                else:
                    items_created += 1

                rows_processed += 1

            except Exception as e:
                errors.append(f"Row {row_idx} Error: {str(e)}")

    return Response({
        "success": True,
        "rows_processed": rows_processed,
        "items_created": items_created,
        "items_updated": items_updated,
        "errors_count": len(errors),
        "errors": errors[:10]  # Return max 10 errors to keep response small
    })
