import type { Order } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import logoEn from '@/assets/logos/logo_en.png';
import logoAr from '@/assets/logos/logo_ar.png';

/**
 * Hardware Service - interfaces with peripheral devices
 */
export const hardwareService = {
  /**
   * Print receipt to thermal printer
   * Uses the Web Print API or falls back to window.print()
   */
  async printReceipt(order: Order, _storeName: string, storeAddress: string): Promise<void> {
    const receiptContent = generateReceiptHTML(order, 'Anibal', storeAddress);

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    }
  },

  /**
   * Open cash drawer (via printer ESC/POS command or API)
   */
  async openCashDrawer(): Promise<void> {
    console.log('[Hardware] Cash drawer opened');
    // In production: send ESC/POS command to printer
    // ESC p 0 25 250 — standard drawer kick pulse
  },

  /**
   * Check if barcode scanner is available
   */
  isScannerAvailable(): boolean {
    // Barcode scanners typically act as keyboard input
    // So they're always "available"
    return true;
  },
};

function generateReceiptHTML(order: Order, storeName: string, storeAddress: string): string {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="text-align:right;font-size:11px;padding:4px 0;vertical-align:top;">
          <div style="font-weight:bold;">${item.product.name}</div>
          ${item.product.sku ? `
          <div style="font-size:9px;color:#666;margin-top:2px;" dir="ltr">
            SKU: ${item.product.sku}
          </div>
          ` : ''}
          ${item.product.variantTree ? `
          <div style="font-size:9px;color:#666;margin-top:2px;">
            ${item.product.variantTree}
          </div>
          ` : ''}
          ${item.product.selections && item.product.selections.length > 0 ? `
          <div style="font-size:9px;color:#666;margin-top:2px;">
            ${item.product.selections.join(' - ')}
          </div>
          ` : ''}
        </td>
        <td style="text-align:center;font-size:11px;vertical-align:top;padding:4px 0;">${item.quantity}</td>
        <td style="text-align:left;font-size:11px;vertical-align:top;padding:4px 0;">${formatCurrency(item.lineTotal)}</td>
      </tr>`
    )
    .join('');

  const paymentRows = order.payments
    .map(
      (p) => `
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
        <span>${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : 'محفظة'}</span>
        <span>${formatCurrency(p.amount)}</span>
      </div>`
    )
    .join('');

  // Use appropriate logo based on language
  const logoUrl = (localStorage.getItem('pos_language') || 'ar') === 'ar' ? logoAr : logoEn;

  return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>Receipt ${order.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; width: 280px; padding: 10px; direction: rtl; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .logo { max-width: 120px; max-height: 80px; margin-bottom: 8px; }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { width: 80mm; padding: 5mm; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <img src="${logoUrl}" alt="${storeName}" class="logo" />
      </div>
      <div class="center bold" style="font-size:16px;margin-bottom:4px;">${storeName}</div>
      <div class="center" style="font-size:11px;margin-bottom:4px;">${storeAddress}</div>
      <div class="divider"></div>
      
      <div style="font-size:11px;margin-bottom:4px;line-height:1.4;">
        <div style="display:flex;justify-content:space-between;">
          <span>رقم الفاتورة:</span>
          <span class="bold">${order.orderNumber}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>التاريخ:</span>
          <span>${formatDate(order.createdAt)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>الكاشير:</span>
          <span>${order.cashierName}</span>
        </div>
        
        ${order.customerName ? `
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;">
          <span>العميل:</span>
          <span class="bold">${order.customerName}</span>
        </div>
        ${order.customerPhone ? `
        <div style="display:flex;justify-content:space-between;">
          <span>الهاتف:</span>
          <span dir="ltr">${order.customerPhone}</span>
        </div>
        ` : ''}
        ` : ''}
      </div>
      <div class="divider"></div>

      <table>
        <thead>
          <tr style="font-size:11px;border-bottom:1px solid #000;">
            <th style="text-align:right;padding-bottom:4px;">الصنف</th>
            <th style="text-align:center;padding-bottom:4px;">الكمية</th>
            <th style="text-align:left;padding-bottom:4px;">المبلغ</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <div class="divider"></div>

      <div style="font-size:12px;line-height:1.6;">
        <div style="display:flex;justify-content:space-between;">
          <span>المجموع الفرعي:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discountTotal > 0 ? `
        <div style="display:flex;justify-content:space-between;color:#000;">
          <span>الخصم:</span>
          <span>-${formatCurrency(order.discountTotal)}</span>
        </div>` : ''}
        ${order.taxTotal > 0 ? `
        <div style="display:flex;justify-content:space-between;">
          <span>الضريبة:</span>
          <span>${formatCurrency(order.taxTotal)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:16px;margin-top:4px;" class="bold">
          <span>الإجمالي:</span>
          <span>${formatCurrency(order.grandTotal)}</span>
        </div>
      </div>
      <div class="divider"></div>

      <div style="margin-bottom:4px;">
        <div class="bold" style="font-size:12px;margin-bottom:4px;">تفاصيل الدفع:</div>
        ${paymentRows}
      </div>

      <div class="divider"></div>
      <div class="center" style="font-size:11px;margin-top:10px;font-weight:bold;">شكراً لزيارتكم</div>
      <div class="center" style="font-size:10px;margin-top:2px;">Thank you for your visit</div>
    </body>
    </html>
  `;
}
