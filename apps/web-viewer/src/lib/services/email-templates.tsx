import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function TenantTransactionalEmail({
  preview,
  heading,
  message,
  tenantName,
}: {
  preview: string;
  heading: string;
  message: string;
  tenantName: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#0f1218", color: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ margin: "0 auto", maxWidth: "560px", padding: "32px 20px" }}>
          <Section style={{ border: "1px solid #273244", borderRadius: "8px", padding: "24px" }}>
            <Text style={{ color: "#94a3b8", fontSize: "12px", letterSpacing: "0", margin: "0 0 12px" }}>
              {tenantName}
            </Text>
            <Heading style={{ color: "#ffffff", fontSize: "24px", lineHeight: "32px", margin: "0 0 16px" }}>
              {heading}
            </Heading>
            <Text style={{ color: "#dbeafe", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
              {message}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
