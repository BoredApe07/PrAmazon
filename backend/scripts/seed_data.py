"""
High-Performance Synthetic Data Seeder for PrAmazon
Generates 1,000+ realistic products across 8 diverse categories
and 5,000+ historical orders spanning the past 180 days with bulk insertion.
"""

import os
import sys
import random
import time
import uuid
from datetime import datetime, timedelta

# Ensure 'backend' directory is in Python path regardless of execution directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace") # type: ignore

from app.core.database import SessionLocal, engine, Base
from app.models import Product, Order, OrderItem, User
from app.core.security import hash_password

# Set deterministic random seed for reproducible datasets
random.seed(42)

# ==============================================================================
# Category Templates & Image Curations (High-Res Unsplash)
# ==============================================================================
CATEGORY_DATA = {
    "Electronics": {
        "brands": ["Sony", "Apple", "Samsung", "Dell", "Bose", "Asus", "Logitech", "Anker", "OnePlus", "Xiaomi"],
        "items": [
            ("Wireless Noise-Cancelling Headphones", 4999, 29990, "Industry-leading active noise cancellation with 30-hour battery life and multi-device pairing."),
            ("Ultra-Slim Laptop", 39999, 134900, "High-performance processor with vivid edge-to-edge Retina display and lightning-fast NVMe storage."),
            ("Smart OLED TV 55-inch", 44999, 89999, "Stunning 4K HDR visuals with Dolby Vision, Dolby Atmos audio, and smart voice assistant integration."),
            ("True Wireless Earbuds", 1999, 14999, "Crystal-clear acoustics with IPX5 water resistance, wireless charging case, and intuitive touch controls."),
            ("Mechanical Gaming Keyboard", 2499, 11999, "Hot-swappable tactile switches, aircraft-grade aluminum chassis, and customizable per-key RGB backlighting."),
            ("Fast Wireless Charging Stand", 899, 2999, "Qi-certified 15W fast charger with intelligent temperature control and horizontal/vertical phone viewing."),
            ("Portable Bluetooth Speaker", 1499, 8999, "Deep resonant bass with 360-degree sound dispersion, waterproof rugged shell, and 24h playtime."),
            ("4K Ultra-HD Webcam", 2999, 9999, "Auto-focus glass lens with dual stereo noise-cancelling microphones and privacy shutter."),
            ("10,000mAh Magnetic Power Bank", 1299, 3999, "Slim pocket-friendly power bank with USB-C Power Delivery and snap-on magnetic alignment."),
            ("Smart Fitness Tracker Band", 1799, 6999, "Continuous SpO2, heart rate, and sleep monitoring with AMOLED touch display and 14-day battery.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Fashion & Apparel": {
        "brands": ["Nike", "Adidas", "Levi's", "Puma", "Zara", "Tommy Hilfiger", "Ray-Ban", "Fossil", "Under Armour"],
        "items": [
            ("Classic Denim Trucker Jacket", 2499, 6999, "Authentic premium washed denim jacket with reinforced metal buttons and timeless relaxed fit."),
            ("Breathable Cotton Crew-Neck T-Shirt", 599, 1499, "100% combed ringspun organic cotton offering supreme breathability and color retention."),
            ("Performance Lightweight Running Shoes", 2999, 11999, "Engineered mesh upper paired with responsive foam cushioning for effortless daily mileage."),
            ("Polarized Classic Aviator Sunglasses", 1999, 7999, "UV400 scratch-resistant polarized lenses with lightweight hypoallergenic alloy frames."),
            ("Minimalist Stainless Steel Chronograph Watch", 3499, 14999, "Precision quartz movement, water-resistant up to 50 meters with genuine leather strap."),
            ("Fleece-Lined Pullover Hoodie", 1299, 3499, "Brushed thermal fleece interior with kangaroo pocket and double-lined drawstring hood."),
            ("Stretch Slim-Fit Chino Trousers", 1499, 3999, "Flexible comfort-stretch cotton twill tailored for versatile business-casual and weekend wear."),
            ("Water-Repellent Commuter Backpack", 1799, 4999, "Durable Oxford fabric with padded 15.6-inch laptop compartment and hidden anti-theft pocket.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Home & Kitchen": {
        "brands": ["Philips", "Morphy Richards", "Prestige", "Nespresso", "Dyson", "Instant Pot", "Wonderchef", "Milton"],
        "items": [
            ("Digital Touch Air Fryer 4.5L", 3999, 9999, "Rapid air circulation technology cuts oil by 90% with 8 one-touch preset cooking modes."),
            ("Compact Espresso & Cappuccino Machine", 6999, 18999, "15-bar Italian pressure pump with manual steam milk frother for rich cafe-style drinks."),
            ("Hard-Anodized Non-Stick Cookware Set (3-Piece)", 1999, 5499, "PFOA-free non-toxic coating with induction-compatible base and ergonomic cool-touch handles."),
            ("Cordless Stick Vacuum Cleaner", 7999, 24999, "High-torque brushless motor with multi-stage HEPA filtration for deep carpet and hardwood cleaning."),
            ("Smart Electric Kettle 1.7L", 1299, 3299, "Food-grade stainless steel with automatic shut-off and boil-dry safety protection."),
            ("Countertop High-Speed Blender", 2499, 7999, "1000-watt motor easily crushes ice, nuts, and frozen fruit for nutrient-dense smoothies."),
            ("Aromatherapy Ultrasonic Essential Oil Diffuser", 799, 2199, "Whisper-quiet cool mist operation with 7 ambient LED colors and automatic auto-off timer.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Books & Literature": {
        "brands": ["O'Reilly", "Penguin", "HarperCollins", "MIT Press", "Pearson", "Bloomsbury"],
        "items": [
            ("Designing Data-Intensive Applications", 1299, 2199, "The definitive guide to architecture, reliability, scalability, and distributed database systems."),
            ("Clean Code: Agile Software Craftsmanship", 799, 1699, "Actionable software principles and design patterns for writing readable, maintainable code."),
            ("Atomic Habits: Easy & Proven Way to Build Good Habits", 399, 799, "Transformative framework for making tiny 1% daily improvements that compound into massive results."),
            ("The Psychology of Money: Timeless Lessons", 299, 599, "Fascinating behavioral insights into wealth, greed, and happiness across 19 short stories."),
            ("Deep Work: Rules for Focused Success", 349, 699, "Cultivate intense cognitive focus in a distracted world to master hard skills and produce elite output."),
            ("System Design Interview – An Insider's Guide", 1499, 2499, "Step-by-step architectural blueprints for cracking large-scale distributed systems interviews."),
            ("Dune (Deluxe Hardcover Edition)", 899, 1899, "Frank Herbert's monumental science fiction masterpiece chronicling Paul Atreides on Arrakis.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Sports & Fitness": {
        "brands": ["Decathlon", "Bowflex", "Manduka", "Reebok", "Everlast", "Garmin", "Spalding"],
        "items": [
            ("Adjustable Quick-Select Dumbbell (Pair)", 5999, 19999, "Replaces 15 weight sets in a single compact dial mechanism ranging from 2.5kg to 24kg."),
            ("Non-Slip High-Density TPE Yoga Mat", 899, 2499, "6mm cushioned eco-friendly surface with alignment guide lines and moisture-resistant grip."),
            ("Speed Jump Rope with Ball Bearings", 399, 1199, "Tangle-free steel cable with 360-degree rotation handles optimized for cardio and double-unders."),
            ("Heavy-Duty Resistance Loop Bands (Set of 5)", 499, 1499, "Natural latex resistance bands for strength training, mobility rehab, and home workout routines."),
            ("Stainless Steel Insulated Sports Bottle 1L", 799, 1999, "Double-wall vacuum insulation keeps liquids ice-cold for 24 hours or steaming hot for 12 hours."),
            ("Foam Roller for Deep Tissue Muscle Massage", 599, 1699, "High-density grid trigger point roller designed to soothe soreness and accelerate muscle recovery.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Beauty & Personal Care": {
        "brands": ["L'Oreal", "Nivea", "The Ordinary", "Philips", "Forest Essentials", "Neutrogena"],
        "items": [
            ("Precision Beard & Hair Trimmer", 1499, 3999, "Self-sharpening titanium-coated blades with 20 length settings and 90-minute cordless runtime."),
            ("Hyaluronic Acid & Vitamin C Facial Serum", 599, 1899, "Hydrating botanical formula targeting dark spots, fine lines, and youthful skin radiance."),
            ("Deep Cleansing Sonic Face Brush", 1299, 3499, "Silicone bristles pulsating at 8,000 vibrations per minute for gentle pore unclogging."),
            ("Hydrating SPF 50 Sunscreen Gel", 499, 1199, "Broad-spectrum UVA/UVB protection with ultra-lightweight, zero white-cast matte finish.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Office & Productivity": {
        "brands": ["Herman Miller", "Logitech", "BenQ", "IKEA", "Keychron", "Fellowes"],
        "items": [
            ("Ergonomic Mesh Office Chair with Lumbar Support", 7999, 24999, "Breathable Korean mesh with 3D adjustable armrests, tilt limiter, and contoured headrest."),
            ("Electric Dual-Motor Standing Desk", 17999, 39999, "Smooth height adjustment from 70cm to 120cm with memory presets and anti-collision sensor."),
            ("ScreenBar e-Reading LED Monitor Light", 3499, 9999, "Asymmetric optical design illuminates workspace without any reflective glare on the screen."),
            ("Large Vegan Leather Desk Blotter Mat", 699, 1899, "Spill-resistant smooth surface for effortless mouse gliding and keyboard stability.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80"
        ]
    },
    "Toys & Gaming": {
        "brands": ["Sony PlayStation", "Microsoft Xbox", "Nintendo", "Razer", "Lego", "SteelSeries"],
        "items": [
            ("Wireless Haptic Feedback Game Controller", 4499, 6999, "Adaptive triggers, immersive motion sensors, and integrated microphone for elite gaming."),
            ("Surround Sound 7.1 Gaming Headset", 2499, 8999, "50mm neodymium acoustic drivers with noise-cancelling detachable boom microphone."),
            ("RGB Ultra-Lightweight Optical Gaming Mouse", 1499, 4999, "Honey-comb ergonomic shell weighing just 62 grams with flawless 16,000 DPI sensor."),
            ("Collector Modular Architecture Building Set", 3999, 14999, "Over 1,200 precision engineering bricks to craft iconic skyline masterpieces.")
        ],
        "images": [
            "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1612287232230-0118548a3c86?w=600&auto=format&fit=crop&q=80"
        ]
    }
}

INDIAN_CITIES = [
    ("Indiranagar, Bangalore", "560038"),
    ("Koramangala, Bangalore", "560034"),
    ("Bandra West, Mumbai", "400050"),
    ("Powai, Mumbai", "400076"),
    ("Cyber City, Gurgaon", "122002"),
    ("Connaught Place, New Delhi", "110001"),
    ("Jubilee Hills, Hyderabad", "500033"),
    ("Hinjawadi, Pune", "411057"),
    ("T. Nagar, Chennai", "600017"),
    ("Salt Lake City, Kolkata", "700091"),
    ("C-Scheme, Jaipur", "302001"),
    ("Bodakdev, Ahmedabad", "380054")
]

CUSTOMER_NAMES = [
    "Priya Sharma", "Rahul Mehta", "Ananya Iyer", "Vikram Singh",
    "Deepak Verma", "Neha Patel", "Arjun Reddy", "Pooja Nair",
    "Aditya Joshi", "Sneha Roy", "Rohan Gupta", "Kavita Menon"
]


def seed_database(target_products: int = 1000, target_orders: int = 5000):
    start_time = time.time()
    db = SessionLocal()

    print("=" * 70)
    print(f"🚀 PRAMAZON ENTERPRISE DATA SEEDER: {target_products}+ PRODUCTS & {target_orders}+ ORDERS")
    print("=" * 70)

    try:
        # ----------------------------------------------------------------------
        # 1. Ensure Core Users Exist
        # ----------------------------------------------------------------------
        print("\n[1/4] Checking and creating user accounts...")
        existing_users = {u.email: u for u in db.query(User).all()}

        if "admin@pramazon.com" not in existing_users:
            admin_user = User(
                name="PrAmazon Administrator",
                email="admin@pramazon.com",
                hashed_password=hash_password("admin123"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            existing_users["admin@pramazon.com"] = admin_user

        if "demo@pramazon.com" not in existing_users:
            demo_user = User(
                name="Demo Shopper",
                email="demo@pramazon.com",
                hashed_password=hash_password("demo123"),
                role="customer"
            )
            db.add(demo_user)
            db.commit()
            existing_users["demo@pramazon.com"] = demo_user

        # Create additional realistic customer personas for order diversity
        customer_users = [u for u in existing_users.values() if u.role == "customer"]
        while len(customer_users) < 10:
            name = random.choice(CUSTOMER_NAMES)
            email = f"{name.lower().replace(' ', '.')}_{random.randint(10, 99)}@example.com"
            if email not in existing_users:
                new_u = User(
                    name=name,
                    email=email,
                    hashed_password=hash_password("shopper123"),
                    role="customer"
                )
                db.add(new_u)
                db.commit()
                customer_users.append(new_u)
                existing_users[email] = new_u

        customer_ids = [u.id for u in customer_users]
        print(f"      Verified {len(customer_ids)} customer accounts for order distribution.")

        # ----------------------------------------------------------------------
        # 2. Seed Products up to Target Count
        # ----------------------------------------------------------------------
        print(f"\n[2/4] Generating catalog up to {target_products} products across 8 categories...")
        existing_products_count = db.query(Product).count()
        needed_products = max(0, target_products - existing_products_count)

        if needed_products > 0:
            product_records = []
            category_keys = list(CATEGORY_DATA.keys())

            for i in range(needed_products):
                cat_name = category_keys[i % len(category_keys)]
                cat_info = CATEGORY_DATA[cat_name]

                brand = random.choice(cat_info["brands"])
                item_name, min_p, max_p, base_desc = random.choice(cat_info["items"])
                image_url = random.choice(cat_info["images"])

                # Generate variations (colors, specs, editions) to ensure distinct titles
                variant_suffixes = ["Pro", "Plus", "Max", "Ultra", "Lite", "Elite", "Series 2", "2026 Edition", "Classic"]
                variant = f"({random.choice(variant_suffixes)})" if random.random() > 0.4 else ""
                
                title = f"{brand} {item_name} {variant}".strip()
                # Occasional differentiator number to guarantee uniqueness
                if random.random() > 0.5:
                    title += f" [Model #{random.randint(100, 999)}]"

                price = round(random.uniform(min_p, max_p), -1)  # Round to nearest 10
                rating = round(random.uniform(3.8, 4.9), 1)
                rating_count = random.randint(25, 4500)
                
                # Realistic stock distribution: 95% in stock, 5% sold out (0 stock)
                stock = 0 if random.random() < 0.05 else random.randint(3, 85)

                product_records.append({
                    "title": title,
                    "description": f"{base_desc} Includes standard manufacturer warranty.",
                    "price": price,
                    "category": cat_name,
                    "image_url": image_url,
                    "rating": rating,
                    "rating_count": rating_count,
                    "stock": stock
                })

            # Fast Bulk Insertion
            db.bulk_insert_mappings(Product, product_records)
            db.commit()
            print(f"      Successfully inserted {len(product_records)} new products in bulk.")
        else:
            print(f"      Catalog already has {existing_products_count} products. Skipping generation.")

        all_products = db.query(Product.id, Product.price).all()
        total_products_now = len(all_products)
        print(f"      Total Products in Catalog: {total_products_now}")

        # ----------------------------------------------------------------------
        # 3. Seed Orders up to Target Count
        # ----------------------------------------------------------------------
        print(f"\n[3/4] Generating order book up to {target_orders} orders...")
        existing_orders_count = db.query(Order).count()
        needed_orders = max(0, target_orders - existing_orders_count)

        if needed_orders > 0:
            max_order_id = db.query(Order.id).order_by(Order.id.desc()).first()
            start_order_id = (max_order_id[0] if max_order_id else 0) + 1

            max_item_id = db.query(OrderItem.id).order_by(OrderItem.id.desc()).first()
            start_item_id = (max_item_id[0] if max_item_id else 0) + 1

            orders_to_insert = []
            order_items_to_insert = []

            # Status distribution: 75% delivered, 10% shipped, 8% out_for_delivery, 4% confirmed, 3% cancelled
            status_choices = (
                ["delivered"] * 75 +
                ["shipped"] * 10 +
                ["out_for_delivery"] * 8 +
                ["confirmed"] * 4 +
                ["cancelled"] * 3
            )

            now = datetime.utcnow()

            for idx in range(needed_orders):
                order_id = start_order_id + idx
                user_id = random.choice(customer_ids)
                
                # Spread timestamps over past 180 days
                days_ago = random.randint(0, 180)
                hours_ago = random.randint(0, 23)
                minutes_ago = random.randint(0, 59)
                order_date = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)

                # Realistic delivery status
                status = random.choice(status_choices)
                # Recent orders within 2 days are more likely in-progress
                if days_ago <= 1 and status == "delivered":
                    status = random.choice(["confirmed", "shipped", "out_for_delivery"])

                city, pincode = random.choice(INDIAN_CITIES)
                address = f"House #{random.randint(10, 899)}, {city} - {pincode}"

                # 1 to 4 items per order
                num_items = random.choices([1, 2, 3, 4], weights=[55, 30, 10, 5])[0]
                selected_products = random.sample(all_products, k=min(num_items, len(all_products)))

                order_total = 0.0
                for p_id, p_price in selected_products:
                    qty = random.choices([1, 2, 3], weights=[80, 15, 5])[0]
                    item_total = p_price * qty
                    order_total += item_total

                    order_items_to_insert.append({
                        "id": start_item_id,
                        "order_id": order_id,
                        "product_id": p_id,
                        "quantity": qty,
                        "unit_price": p_price
                    })
                    start_item_id += 1

                orders_to_insert.append({
                    "id": order_id,
                    "user_id": user_id,
                    "idempotency_key": f"seed_order_{order_id}_{uuid.uuid4().hex[:6]}",
                    "shipping_address": address,
                    "total_amount": round(order_total, 2),
                    "status": status,
                    "created_at": order_date
                })

            # Bulk insert orders first, then order items
            print(f"      Bulk inserting {len(orders_to_insert)} orders...")
            db.bulk_insert_mappings(Order, orders_to_insert)
            db.commit()

            print(f"      Bulk inserting {len(order_items_to_insert)} order items...")
            db.bulk_insert_mappings(OrderItem, order_items_to_insert)
            db.commit()
            print(f"      Successfully inserted {len(orders_to_insert)} orders and {len(order_items_to_insert)} order items.")
        else:
            print(f"      Order book already has {existing_orders_count} orders. Skipping generation.")

        total_orders_now = db.query(Order).count()
        total_items_now = db.query(OrderItem).count()

        elapsed = time.time() - start_time
        print("\n" + "=" * 70)
        print("✅ DATABASE SEEDING COMPLETE")
        print("=" * 70)
        print(f"  • Total Products in Catalog : {total_products_now}")
        print(f"  • Total Orders in Database  : {total_orders_now}")
        print(f"  • Total Line Items Stored   : {total_items_now}")
        print(f"  • Execution Time            : {elapsed:.2f} seconds")
        print("=" * 70 + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database(target_products=1000, target_orders=5000)
