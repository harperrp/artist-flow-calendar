import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ExportData = Record<string, any>[];

export function exportToCSV(data: ExportData, filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportToJSON(data: ExportData, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, "application/json");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDataForExport(type: "leads" | "events" | "contracts", data: any[]) {
  const timestamp = format(new Date(), "yyyy-MM-dd", { locale: ptBR });

  if (type === "leads") {
    return {
      filename: `leads_${timestamp}`,
      data: data.map((item) => ({
        Nome: item.contractor_name,
        Tipo: item.contractor_type || "",
        Cidade: item.city || "",
        Estado: item.state || "",
        Etapa: item.stage,
        Valor: item.fee || 0,
        Data: item.event_date || "",
        Email: item.contact_email || "",
        Telefone: item.contact_phone || "",
        Origem: item.origin || "",
        Notas: item.notes || "",
      })),
    };
  }

  if (type === "events") {
    return {
      filename: `eventos_${timestamp}`,
      data: data.map((item) => ({
        Título: item.title,
        Status: item.status,
        "Data Início": item.start_time,
        Cidade: item.city || "",
        Estado: item.state || "",
        Valor: item.fee || 0,
        Contratante: item.contractor_name || "",
        Local: item.venue_name || "",
      })),
    };
  }

  if (type === "contracts") {
    return {
      filename: `contratos_${timestamp}`,
      data: data.map((item) => ({
        ID: item.id,
        Status: item.status,
        Valor: item.fee || 0,
        "Forma de Pagamento": item.payment_method || "",
        Lead: item.leads?.contractor_name || "",
        Cidade: item.leads?.city || "",
        "Criado em": item.created_at,
      })),
    };
  }

  return { filename: `export_${timestamp}`, data };
}
