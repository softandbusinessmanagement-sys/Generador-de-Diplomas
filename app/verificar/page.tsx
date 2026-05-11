import { VerifyClient } from "@/app/verificar/verify-client";

export default function VerifyPage({
  searchParams
}: {
  searchParams?: {
    token?: string;
    dni?: string;
  };
}) {
  const initialQuery = searchParams?.token ?? searchParams?.dni ?? "";
  return <VerifyClient initialQuery={initialQuery} />;
}
