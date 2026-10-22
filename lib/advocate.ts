// The advocate who reviews, signs and sends notices. Details are from the advocate's Bar Council
// identity card. There is deliberately NO signature image here: a signature is added by the advocate
// on the approved notice, outside this app, so nothing can be signed without her.

export const ADVOCATE = {
  name: "Diya H",
  title: "Advocate",
  council: "Karnataka State Bar Council",
  enrolment: "KAR/1067/2026",
  enrolmentDate: "13 June 2026",
  place: "Bengaluru",
  reviewEmail: "diyaharish1207@gmail.com",
} as const;

/** The advocate's lines at the foot of a notice, shown as pending until she signs it. */
export function advocateLines(): string[] {
  return [
    "(Signed by the advocate after review. Not valid until signed.)",
    ADVOCATE.name,
    ADVOCATE.title,
    `${ADVOCATE.council}, Enrolment No. ${ADVOCATE.enrolment}`,
    ADVOCATE.place,
  ];
}
