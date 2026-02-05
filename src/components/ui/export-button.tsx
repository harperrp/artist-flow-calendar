import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { exportToCSV, exportToJSON, formatDataForExport } from "@/lib/export-utils";
import { toast } from "sonner";

interface ExportButtonProps {
  type: "leads" | "events" | "contracts";
  data: any[];
  disabled?: boolean;
}

export function ExportButton({ type, data, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    if (!data.length) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    setExporting(true);
    try {
      const { filename, data: formattedData } = formatDataForExport(type, data);

      if (format === "csv") {
        exportToCSV(formattedData, filename);
      } else {
        exportToJSON(formattedData, filename);
      }

      toast.success(`Exportado com sucesso`, {
        description: `${data.length} registros exportados como ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast.error("Erro ao exportar", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || exporting} className="gap-2">
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2 cursor-pointer">
          <FileJson className="h-4 w-4" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
