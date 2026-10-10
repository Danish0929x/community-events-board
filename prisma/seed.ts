import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Dates are relative to "today in India" so the sample data stays upcoming whenever
// the seed is run. daysFromNow < 0 gives a past event.
function istDate(daysFromNow: number, hour: number, minute = 0): Date {
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const utcMs = Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate() + daysFromNow, hour, minute);
  return new Date(utcMs - IST_OFFSET_MS);
}

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

const events = [
  // Music
  { title: "Jazz & Blues Night", category: "Music", city: "Coimbatore", startsAt: istDate(3, 19, 30), price: 499, imageUrl: img("1415201364774-f6f0bb35f28f"),
    description: "A cosy evening of live jazz standards and slow blues by the Brookefields Quartet. Doors open at 7 PM, seating is first come first served." },
  { title: "Indie Rooftop Night", category: "Music", city: "Bengaluru", startsAt: istDate(6, 20, 0), price: 799, imageUrl: img("1470229722913-7c0e2dbbafd3"),
    description: "Three up-and-coming indie bands play under the stars on an Indiranagar rooftop. Food and drinks available at the venue." },
  { title: "Carnatic Fusion Evening", category: "Music", city: "Chennai", startsAt: istDate(12, 18, 30), price: 350, imageUrl: img("1493225457124-a3eb161ffa5f"),
    description: "Veena meets electric guitar. A fusion set blending classic kritis with modern grooves, followed by a short Q&A with the artists." },
  { title: "Retro Bollywood Night", category: "Music", city: "Coimbatore", startsAt: istDate(9, 20, 0), price: 299, isActive: false, imageUrl: img("1514525253161-7a46d19cd819"),
    description: "Sing along to the best of the 70s and 80s with a live band. (Inactive: postponed by the organisers.)" },

  // Workshop
  { title: "Pottery for Beginners", category: "Workshop", city: "Coimbatore", startsAt: istDate(4, 10, 0), price: 1500, imageUrl: img("1565193566173-7a0ee3dbe261"),
    description: "Learn to centre clay and throw your first bowl on the wheel. All materials included, and you take your pieces home after firing." },
  { title: "Startup Pitch Workshop", category: "Workshop", city: "Bengaluru", startsAt: istDate(9, 14, 0), price: 2500, imageUrl: img("1556761175-5973dc0f32e7"),
    description: "A hands-on afternoon on building a 5-minute pitch. Bring your idea; you will rehearse in small groups and get feedback from founders." },
  { title: "Photography Walk & Workshop", category: "Workshop", city: "Chennai", startsAt: istDate(-5, 6, 30), price: 999, imageUrl: img("1452587925148-ce544e77e70d"),
    description: "A sunrise walk along Marina Beach with tips on composition and light. (Past event.)" },

  // Food
  { title: "Street Food Festival", category: "Food", city: "Chennai", startsAt: istDate(2, 17, 0), price: 0, imageUrl: img("1555939594-58d7cb561ad1"),
    description: "Forty stalls of kothu parotta, bajji, sundal and more at Besant Nagar. Free entry; pay at the stalls." },
  { title: "Kongu Food Fair", category: "Food", city: "Coimbatore", startsAt: istDate(8, 12, 0), price: 200, imageUrl: img("1504674900247-0877df9cc836"),
    description: "Taste traditional Kongu Nadu dishes cooked by home chefs. The entry ticket includes three tasting coupons." },
  { title: "Night Market Food Crawl", category: "Food", city: "Mumbai", startsAt: istDate(15, 19, 0), price: 650, imageUrl: img("1533777857889-4be7c70b33f7"),
    description: "A guided evening crawl through Mohammed Ali Road's night market, with eight stops and plenty of sweets." },

  // Sports
  { title: "Corporate Cricket League", category: "Sports", city: "Bengaluru", startsAt: istDate(30, 7, 0), price: 150000, imageUrl: img("1531415074968-036ba1b575da"),
    description: "A weekend T10 tournament for company teams. The price is per team of 15 and includes kits, umpires and lunch." },
  { title: "Night Run 5K", category: "Sports", city: "Coimbatore", startsAt: istDate(10, 21, 0), price: 300, imageUrl: img("1476480862126-209bfaa8edc8"),
    description: "A fun 5K under the lights around Race Course Road. Glow bands for everyone and medals for all finishers." },
  { title: "Sunday Football League", category: "Sports", city: "Hyderabad", startsAt: istDate(-12, 8, 0), price: 0, imageUrl: img("1574629810360-7efbbe195018"),
    description: "Friendly 7-a-side matches for adults at Gachibowli. (Past event.)" },

  // Kids
  { title: "Kids Science Carnival", category: "Kids", city: "Bengaluru", startsAt: istDate(5, 11, 0), price: 250, imageUrl: img("1587654780291-39c9404d746b"),
    description: "Build a LEGO bridge, make slime and launch water rockets. For ages 6 to 12, and parents are welcome to join in." },
  { title: "Storytelling & Puppet Show", category: "Kids", city: "Coimbatore", startsAt: istDate(7, 16, 0), price: 150, isActive: false, imageUrl: img("1503454537195-1dcabb73ffb9"),
    description: "Folk tales brought to life with hand puppets. For ages 3 to 8. (Inactive: hidden by admin.)" },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@events.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await hashPassword(adminPassword), role: "ADMIN" },
    create: { email: adminEmail, passwordHash: await hashPassword(adminPassword), role: "ADMIN" },
  });

  // A ready-made visitor account so reviewers can try My Feed without signing up.
  const demo = await prisma.user.upsert({
    where: { email: "demo@events.local" },
    update: {},
    create: { email: "demo@events.local", passwordHash: await hashPassword("Demo@1234"), role: "USER" },
  });
  await prisma.favouriteCategory.deleteMany({ where: { userId: demo.id } });
  await prisma.favouriteCategory.createMany({
    data: ["Music", "Food"].map((category) => ({ userId: demo.id, category })),
  });

  // Re-running the seed resets events (reminders and card designs cascade with them).
  await prisma.event.deleteMany();
  await prisma.event.createMany({ data: events });

  console.log(`Seeded ${events.length} events, admin ${adminEmail}, demo user demo@events.local`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
