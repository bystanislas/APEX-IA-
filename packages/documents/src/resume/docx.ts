import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import type { ResumeData } from "./types";
import { RESUME_LABELS } from "./labels";

const GOLD = "B8892B";

function dateRange(start: string, end: string | undefined, current: boolean | undefined, present: string) {
  return `${start} — ${current ? present : end ?? present}`;
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), color: GOLD, bold: true, size: 20 })],
  });
}

export async function renderResumeDocx(data: ResumeData): Promise<Buffer> {
  const t = RESUME_LABELS[data.locale];
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: data.contact.fullName, bold: true, size: 40 })],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: data.contact.title, color: GOLD, size: 24 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: [data.contact.email, data.contact.phone, data.contact.location]
            .filter(Boolean)
            .join("  ·  "),
          size: 18,
          color: "555555",
        }),
      ],
    })
  );

  if (data.summary) {
    children.push(sectionHeading(t.summary));
    children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 20 })] }));
  }

  if (data.experiences.length > 0) {
    children.push(sectionHeading(t.experience));
    for (const exp of data.experiences) {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true, size: 20 }),
            new TextRun({
              text: `   ${dateRange(exp.startDate, exp.endDate, exp.current, t.present)}`,
              italics: true,
              size: 18,
              color: "555555",
            }),
          ],
        })
      );
      for (const h of exp.highlights) {
        children.push(
          new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: h, size: 19 })] })
        );
      }
    }
  }

  if (data.education.length > 0) {
    children.push(sectionHeading(t.education));
    for (const ed of data.education) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: `${ed.degree} — ${ed.school}`, bold: true, size: 20 }),
            new TextRun({
              text: `   ${dateRange(ed.startDate, ed.endDate, false, t.present)}`,
              italics: true,
              size: 18,
              color: "555555",
            }),
          ],
        })
      );
    }
  }

  if (data.skills.length > 0) {
    children.push(sectionHeading(t.skills));
    children.push(new Paragraph({ children: [new TextRun({ text: data.skills.join(" · "), size: 19 })] }));
  }

  if (data.languages.length > 0) {
    children.push(sectionHeading(t.languages));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.languages.map((l) => `${l.name} (${l.level})`).join(" · "),
            size: 19,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: { default: { document: { run: { font: "Calibri" } } } },
  });

  return Packer.toBuffer(doc);
}
