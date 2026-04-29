import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatFCFA, formatDateShort } from './format'

export async function generateTransactionReceipt(tx: any, profile: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width

  // --- Header ---
  doc.setFillColor(15, 23, 42) // Slate-900
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('TONTIGO', 14, 25)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reçu de Transaction Officiel', 14, 32)
  doc.text(new Date().toLocaleString('fr-FR'), pageWidth - 60, 25)

  // --- Content ---
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.text('DÉTAILS DU CLIENT', 14, 55)
  
  doc.setFontSize(10)
  doc.text(`Nom : ${profile?.full_name || 'Utilisateur Tontigo'}`, 14, 62)
  doc.text(`Téléphone : ${profile?.phone || 'N/A'}`, 14, 67)
  doc.text(`ID Client : ${tx.user_id.slice(0, 8)}`, 14, 72)

  // --- Table ---
  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Méthode', 'Référence', 'Montant']],
    body: [[
      tx.description || tx.type,
      (tx.wallet_used || 'Wallet').toUpperCase(),
      tx.external_reference || 'N/A',
      formatFCFA(tx.amount)
    ]],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 10, cellPadding: 5 },
  })

  // --- Status & Footer ---
  const finalY = (doc as any).lastAutoTable.finalY + 20
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Statut : CONFIRMÉ', 14, finalY)
  
  doc.setDrawColor(200, 200, 200)
  doc.line(14, finalY + 10, pageWidth - 14, finalY + 10)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text('Ce document est un reçu numérique généré automatiquement par Tontigo.', 14, finalY + 20)
  doc.text('Merci de votre confiance !', 14, finalY + 25)

  // --- Save ---
  doc.save(`Recu_Tontigo_${tx.id.slice(0, 8)}.pdf`)
}
