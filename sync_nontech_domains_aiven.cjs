const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const domains = {
  "2025WSHP0057": "Sales & Business Development",
  "2025WSHP0004": "Marketing Analytics",
  "2025WSHP0009": "Human Resources",
  "2025WSHP0110": "Digital Marketing",
  "2025WSHP0034": "Digital Marketing",
  "2025WSHP0003": "Media & Content",
  "2025WSHP0001": "Digital Marketing",
  "2025WSHP0146": "Sales & Marketing",
  "2025WSHP0021": "Content & Writing",
  "2025WSHP0073": "Business Operations",
  "2025WSHP0048": "Digital Marketing",
  "2025WSHP0007": "Telecalling & Customer Support",
  "2025WSHP0012": "Sales",
  "2025WSHP0156": "Sales",
  "2025WSHP0147": "Legal",
  "2025WSHP0130": "Marketing & Community",
  "2025WSHP0077": "Sales & Customer Relationship Management",
  "2025WSHP0022": "Customer Support & Operations",
  "2025WSHP0358": "Corporate Sales & Marketing",
  "2025WSHP0123": "Human Resources",
  "2025WSHP0076": "Event Management",
  "2025WSHP0052": "Influencer Marketing",
  "2025WSHP0306": "Talent Acquisition & Recruitment",
  "2025WSHP0771": "E-commerce & Content",
  "2025WSHP0222": "Marketing Strategy",
  "2025WSHP0603": "Public Relations & Media"
};

async function main() {
  for (const [id, domain] of Object.entries(domains)) {
    await prisma.internship.update({
      where: { id: id },
      data: { domain }
    });
  }

  console.log(`Updated ${Object.keys(domains).length} non-technical internship domains.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
