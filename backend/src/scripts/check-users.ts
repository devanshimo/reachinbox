import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: "dev@example.com",
    },
  });

  if (!user) {
    throw new Error("Development user not found");
  }

  const sender = await prisma.sender.create({
    data: {
      userId: user.id,
      email: "dev-sender@example.com",
    },
  });

  console.log("Created development sender:");
  console.log(JSON.stringify(sender, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });