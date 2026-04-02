from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from consumption.models import DailyConsumption, DataQualityIssue
from inventory.models import InventoryItem, InventoryStock, Supplier


SUPPLIERS = [
    {
        "supplier_id": "201",
        "supplier_name": "Fresh Farms Co.",
        "contact": "fresh@example.com",
        "location": "Mumbai",
    },
    {
        "supplier_id": "202",
        "supplier_name": "Kitchen Essentials Ltd.",
        "contact": "kitchen@example.com",
        "location": "Delhi",
    },
    {
        "supplier_id": "203",
        "supplier_name": "Daily Dairy Supply",
        "contact": "dairy@example.com",
        "location": "Bengaluru",
    },
    {
        "supplier_id": "204",
        "supplier_name": "Pantry Wholesale Hub",
        "contact": "pantry@example.com",
        "location": "Chennai",
    },
]

INVENTORY_ITEMS = [
    {
        "item_id": "101",
        "item_name": "Rice",
        "category": "Grains",
        "unit": "kg",
        "supplier_id": "201",
        "cost_per_unit": Decimal("52.00"),
    },
    {
        "item_id": "102",
        "item_name": "Milk",
        "category": "Dairy",
        "unit": "litre",
        "supplier_id": "203",
        "cost_per_unit": Decimal("34.50"),
    },
    {
        "item_id": "103",
        "item_name": "Tomatoes",
        "category": "Vegetables",
        "unit": "kg",
        "supplier_id": "201",
        "cost_per_unit": Decimal("28.00"),
    },
    {
        "item_id": "104",
        "item_name": "Cooking Oil",
        "category": "Pantry",
        "unit": "litre",
        "supplier_id": "204",
        "cost_per_unit": Decimal("145.00"),
    },
]

STOCK_ROWS = [
    {
        "stock_id": "301",
        "item_id": "101",
        "quantity_available": Decimal("180.00"),
        "reorder_level": Decimal("60.00"),
    },
    {
        "stock_id": "302",
        "item_id": "102",
        "quantity_available": Decimal("90.00"),
        "reorder_level": Decimal("30.00"),
    },
    {
        "stock_id": "303",
        "item_id": "103",
        "quantity_available": Decimal("75.00"),
        "reorder_level": Decimal("25.00"),
    },
    {
        "stock_id": "304",
        "item_id": "104",
        "quantity_available": Decimal("50.00"),
        "reorder_level": Decimal("20.00"),
    },
]

CONSUMPTION_ROWS = [
    {
        "consumption_id": "401",
        "item_id": "101",
        "quantity_used": Decimal("12.50"),
        "date": "2026-04-01",
        "department": "Kitchen",
    },
    {
        "consumption_id": "402",
        "item_id": "102",
        "quantity_used": Decimal("18.00"),
        "date": "2026-04-01",
        "department": "Cafeteria",
    },
    {
        "consumption_id": "403",
        "item_id": "103",
        "quantity_used": Decimal("9.25"),
        "date": "2026-04-02",
        "department": "Kitchen",
    },
    {
        "consumption_id": "404",
        "item_id": "106",
        "quantity_used": Decimal("7.00"),
        "date": "2026-04-02",
        "department": "Bakery",
    },
    {
        "consumption_id": "405",
        "item_id": "107",
        "quantity_used": Decimal("4.50"),
        "date": "2026-04-02",
        "department": "Catering",
    },
]


class Command(BaseCommand):
    help = "Seed sample suppliers, inventory, stock, and consumption data."

    @transaction.atomic
    def handle(self, *args, **options):
        self._seed_suppliers()
        self._seed_inventory_items()
        self._seed_stock_rows()
        valid_count, invalid_count = self._seed_consumption_rows()

        self.stdout.write(self.style.SUCCESS("Sample data seeded successfully."))
        self.stdout.write(
            f"Suppliers: {len(SUPPLIERS)}, Items: {len(INVENTORY_ITEMS)}, "
            f"Stocks: {len(STOCK_ROWS)}, Valid consumptions: {valid_count}, "
            f"Invalid consumptions: {invalid_count}"
        )

    def _seed_suppliers(self):
        for supplier_data in SUPPLIERS:
            Supplier.objects.update_or_create(
                supplier_id=supplier_data["supplier_id"],
                defaults={
                    "supplier_name": supplier_data["supplier_name"],
                    "contact": supplier_data["contact"],
                    "location": supplier_data["location"],
                },
            )

    def _seed_inventory_items(self):
        for item_data in INVENTORY_ITEMS:
            supplier = Supplier.objects.get(supplier_id=item_data["supplier_id"])
            InventoryItem.objects.update_or_create(
                item_id=item_data["item_id"],
                defaults={
                    "item_name": item_data["item_name"],
                    "category": item_data["category"],
                    "unit": item_data["unit"],
                    "supplier": supplier,
                    "cost_per_unit": item_data["cost_per_unit"],
                },
            )

    def _seed_stock_rows(self):
        for stock_data in STOCK_ROWS:
            item = InventoryItem.objects.get(item_id=stock_data["item_id"])
            InventoryStock.objects.update_or_create(
                stock_id=stock_data["stock_id"],
                defaults={
                    "item": item,
                    "quantity_available": stock_data["quantity_available"],
                    "reorder_level": stock_data["reorder_level"],
                },
            )

    def _seed_consumption_rows(self):
        valid_count = 0
        invalid_count = 0

        for row in CONSUMPTION_ROWS:
            item = InventoryItem.objects.filter(item_id=row["item_id"]).first()
            is_valid = item is not None

            DailyConsumption.objects.update_or_create(
                consumption_id=row["consumption_id"],
                defaults={
                    "item": item,
                    "raw_item_id": row["item_id"],
                    "quantity_used": row["quantity_used"],
                    "date": row["date"],
                    "department": row["department"],
                    "is_valid": is_valid,
                },
            )

            if is_valid:
                valid_count += 1
                DataQualityIssue.objects.filter(
                    raw_item_id=row["item_id"],
                    issue_type="missing_item",
                    source_table="DailyConsumption",
                ).delete()
                continue

            invalid_count += 1
            DataQualityIssue.objects.update_or_create(
                raw_item_id=row["item_id"],
                issue_type="missing_item",
                source_table="DailyConsumption",
                defaults={
                    "description": (
                        f"Consumption row {row['consumption_id']} references "
                        f"missing inventory item {row['item_id']}."
                    ),
                    "resolved": False,
                },
            )

        return valid_count, invalid_count
