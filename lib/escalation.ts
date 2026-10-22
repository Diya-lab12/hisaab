// Official routes if a company doesn't resolve a complaint. Only portals whose public pages were read
// are listed. Portals change, so the screen tells people to check each site for current steps.

export type Route = { id: string; title: string; body: string; links: { label: string; url: string }[] };

export const ROUTES: Route[] = [
  {
    id: "nch",
    title: "National Consumer Helpline",
    body: "A government helpline for consumer complaints. It lists 1915 as the toll-free number (reported as 8 AM to 8 PM), a WhatsApp number (+91 8800001915), and a website where you can file and track a complaint. Some companies are partners that answer complaints directly.",
    links: [{ label: "consumerhelpline.gov.in", url: "https://consumerhelpline.gov.in" }],
  },
  {
    id: "ejagriti",
    title: "File with the Consumer Commission",
    body: "e-Jagriti is the online portal for filing with the District, State and National Consumer Commissions. Under Section 69 of the Act, a complaint must normally be filed within two years of the problem arising. Which Commission hears it depends on the amount, and those limits changed in 2021, so confirm the current limit on the portal.",
    links: [{ label: "e-jagriti.gov.in", url: "https://e-jagriti.gov.in" }],
  },
];

export const SECTOR: { label: string; name: string; url: string }[] = [
  { label: "Banks and lenders", name: "RBI Complaint Management System", url: "https://cms.rbi.org.in" },
  { label: "Insurance", name: "IRDAI Bima Bharosa", url: "https://bimabharosa.irdai.gov.in" },
  { label: "Investments and brokers", name: "SEBI SCORES", url: "https://scores.sebi.gov.in" },
  { label: "Airlines", name: "AirSewa (Ministry of Civil Aviation)", url: "https://airsewa.gov.in" },
];
