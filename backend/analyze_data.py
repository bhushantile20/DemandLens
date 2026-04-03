from consumption.models import DailyConsumption
from django.db.models import Count, Min, Max

total_records = DailyConsumption.objects.count()
item_stats = DailyConsumption.objects.values('item__item_name').annotate(
    count=Count('id'),
    first_date=Min('date'),
    last_date=Max('date')
).order_by('-count')

print(f"Total Consumption Records: {total_records}")
print("\nStats per Item:")
print(f"{'Item Name':<30} | {'Record Count':<12} | {'Date Range':<25}")
print("-" * 75)
for item in item_stats:
    name = item['item__item_name'] or "Unknown"
    count = item['count']
    drange = f"{item['first_date']} to {item['last_date']}"
    print(f"{name:<30} | {count:<12} | {drange:<25}")
