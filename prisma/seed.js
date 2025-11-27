const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  await prisma.status.createMany({
    data: [
      { name: "Open", color: "#3B82F6" },
      { name: "In Progress", color: "#F59E0B" },
      { name: "Resolved", color: "#10B981" },
      { name: "Closed", color: "#6B7280" },
    ],
    skipDuplicates: true,
  });

  await prisma.role.createMany({
    data: [{ name: "Admin" }, { name: "Support" }],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
