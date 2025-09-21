import "./preview.css";

export const metadata = {
  title: "Skemya Form",
  description: "Complete this form",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  // Preview layout sans navigation ni header
  return <>{children}</>;
}
