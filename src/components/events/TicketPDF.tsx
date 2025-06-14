
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Event } from "@/types/event";

// Basic ticket styles
const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: '#f4f4fc' },
  section: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#276BB8' },
  row: { marginBottom: 6, fontSize: 14 },
  label: { fontWeight: 'bold' },
});

interface TicketPDFProps {
  event: Event;
  buyerName: string;
  buyerEmail: string;
  ticketsQuantity: number;
  txRef: string;
}

export const TicketPDF: React.FC<TicketPDFProps> = ({
  event,
  buyerName,
  buyerEmail,
  ticketsQuantity,
  txRef,
}) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{event.name} - Ticket</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.row}>
          <Text style={styles.label}>Event: </Text>{event.name}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Category: </Text>{event.category}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Date: </Text>{event.date}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Location: </Text>{event.location}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.row}>
          <Text style={styles.label}>Ticket holder: </Text>{buyerName}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Email: </Text>{buyerEmail}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Quantity: </Text>{ticketsQuantity}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Reference: </Text>{txRef}
        </Text>
      </View>
      <View>
        <Text style={{ fontSize: 10, color: "#999" }}>
          Present this ticket (print or on device) at the event entrance.
        </Text>
      </View>
    </Page>
  </Document>
);
