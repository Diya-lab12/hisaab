import { ADVOCATE } from "@/lib/advocate";

/** The advocate's letterhead at the top of a notice sheet. */
export default function NoticeLetterhead() {
  return (
    <header className="a4-letterhead">
      <strong>{ADVOCATE.name}, {ADVOCATE.title}</strong>
      <span>{ADVOCATE.council} · Enrolment No. {ADVOCATE.enrolment}</span>
      <span>{ADVOCATE.place}</span>
    </header>
  );
}
