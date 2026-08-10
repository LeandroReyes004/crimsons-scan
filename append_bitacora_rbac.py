import datetime

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\bitacora.md', 'a', encoding='utf-8') as f:
    f.write("\n\n### 2026-07-18 - Implementación de RBAC en Panel Financiero\n")
    f.write("- **Frontend**: Se modificó `SectionRevenue` en `page.tsx` para ocultar la información financiera (Total Generado, CPM Acordado) a los roles afiliados (`admin_scan`, `admin`). Solo pueden visualizar sus vistas válidas generadas, mientras que los datos monetarios quedaron exclusivos para la vista global del `superadmin`.\n")
    f.write("- **Backend**: Se verificó que los endpoints de ingresos (`/api/admin/revenue` y `/api/admin/revenue/:scanId`) ya se encontraban saneados, puesto que solo despachan la métrica de vistas sin exponer los montos calculados (el cálculo del revenue rate se procesa en el front).\n")
