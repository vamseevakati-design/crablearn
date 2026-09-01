import { Inbox } from "@novu/react";

export default function NotificationInbox({ subscriber }) {
  const applicationIdentifier = String(import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER || "").trim();
  const subscriberId = String(subscriber?.id || subscriber?.phone || subscriber?.email || "").trim();
  const backendUrl = String(import.meta.env.VITE_NOVU_BACKEND_URL || "").trim();
  const socketUrl = String(import.meta.env.VITE_NOVU_SOCKET_URL || "").trim();

  if (!applicationIdentifier || !subscriberId) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      {...(backendUrl ? { backendUrl } : {})}
      {...(socketUrl ? { socketUrl } : {})}
      appearance={{
        baseTheme: "light",
        variables: {
          colorPrimary: "#ea580c",
          colorPrimaryForeground: "#ffffff",
          colorSecondary: "#f59e0b",
          colorSecondaryForeground: "#1c1917",
          colorCounter: "#c2410c",
          colorCounterForeground: "#ffffff",
          colorBackground: "#ffffff",
          colorRing: "#ea580c",
          colorForeground: "#1c1917",
          colorNeutral: "#e7e5e4",
          colorShadow: "rgba(15, 23, 42, 0.12)",
          fontSize: "14px"
        },
        elements: {
          bellIcon: {
            color: "#1c1917"
          }
        }
      }}
      placement="bottom-end"
      placementOffset={{ main: 10, cross: 0 }}
    />
  );
}