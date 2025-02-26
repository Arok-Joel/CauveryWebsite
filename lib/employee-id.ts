import { db } from "./db";

export async function generateEmployeeId(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Get the latest employee for the current year
  const latestEmployee = await db.employee.findFirst({
    where: {
      id: {
        startsWith: `RCF${currentYear}`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  // If no employee exists for this year, start with 001
  if (!latestEmployee) {
    return `RCF${currentYear}001`;
  }

  // Extract the sequence number and increment it
  const currentSequence = parseInt(latestEmployee.id.slice(-3));
  const nextSequence = (currentSequence + 1).toString().padStart(3, "0");

  return `RCF${currentYear}${nextSequence}`;
}
