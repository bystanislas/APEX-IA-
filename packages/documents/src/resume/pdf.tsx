import { Document, Page, Text, View, StyleSheet, Link, renderToBuffer } from "@react-pdf/renderer";
import type { ResumeData } from "./types";
import { RESUME_LABELS } from "./labels";

const GOLD = "#B8892B";
const INK = "#111111";
const MUTED = "#555555";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  header: { marginBottom: 14, borderBottom: `2pt solid ${GOLD}`, paddingBottom: 10 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 12, color: GOLD, marginTop: 2 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 10 },
  contactItem: { fontSize: 9, color: MUTED },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  entry: { marginBottom: 8 },
  entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  entryRole: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  entryMeta: { fontSize: 9, color: MUTED },
  bullet: { fontSize: 9.5, marginTop: 2, marginLeft: 8 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: {
    fontSize: 8.5,
    borderWidth: 0.5,
    borderColor: GOLD,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
});

function dateRange(start: string, end: string | undefined, current: boolean | undefined, present: string) {
  return `${start} — ${current ? present : end ?? present}`;
}

export function ResumeDocument({ data }: { data: ResumeData }) {
  const t = RESUME_LABELS[data.locale];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.contact.fullName}</Text>
          <Text style={styles.title}>{data.contact.title}</Text>
          <View style={styles.contactRow}>
            {data.contact.email && <Text style={styles.contactItem}>{data.contact.email}</Text>}
            {data.contact.phone && <Text style={styles.contactItem}>{data.contact.phone}</Text>}
            {data.contact.location && <Text style={styles.contactItem}>{data.contact.location}</Text>}
            {data.contact.links?.map((l) => (
              <Link key={l.url} src={l.url} style={styles.contactItem}>
                {l.label}
              </Link>
            ))}
          </View>
        </View>

        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.summary}</Text>
            <Text>{data.summary}</Text>
          </View>
        )}

        {data.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.experience}</Text>
            {data.experiences.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryRole}>
                    {exp.role} — {exp.company}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {dateRange(exp.startDate, exp.endDate, exp.current, t.present)}
                  </Text>
                </View>
                {exp.location && <Text style={styles.entryMeta}>{exp.location}</Text>}
                {exp.highlights.map((h, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {h}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.education}</Text>
            {data.education.map((ed, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryRole}>
                    {ed.degree} — {ed.school}
                  </Text>
                  <Text style={styles.entryMeta}>{dateRange(ed.startDate, ed.endDate, false, t.present)}</Text>
                </View>
                {ed.location && <Text style={styles.entryMeta}>{ed.location}</Text>}
              </View>
            ))}
          </View>
        )}

        {data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.skills}</Text>
            <View style={styles.skillsWrap}>
              {data.skills.map((s) => (
                <Text key={s} style={styles.skillChip}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        )}

        {data.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.languages}</Text>
            <Text>{data.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(data: ResumeData): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument data={data} />);
}
