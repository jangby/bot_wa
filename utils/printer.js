const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const fs = require('fs');
const path = require('path');

// ==========================================
// ⚙️ KONFIGURASI PRINTER
// Pastikan nama ini SAMA dengan di Control Panel > Printer Properties > Sharing
// ==========================================
const SHARE_NAME = 'POS58'; 
const PRINTER_PATH = `\\\\localhost\\${SHARE_NAME}`; 

module.exports = {
    printStruk: async (data) => {
        try {
            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://xxx', 
                characterSet: CharacterSet.PC852_LATIN2,
                removeSpecialCharacters: false,
                lineCharacter: "-", 
                width: 32, // 🔥 STANDAR 58MM (Agar tidak berantakan)
                options: { timeout: 5000 }
            });

            // ==========================================
            // 🎨 DESAIN HEADER (INVERSE MODE)
            // ==========================================
            printer.alignCenter();
            printer.invert(true); // Blok Hitam
            printer.bold(true);
            printer.println(" BOT STORE INDONESIA "); // Spasi biar agak lebar
            printer.invert(false); // Matikan Blok Hitam
            printer.bold(false);
            
            printer.newLine();
            printer.println("Jalan Server Digital No. 99");
            printer.println("WhatsApp: 0812-3456-7890");
            printer.println("================================"); // 32 Karakter

            // ==========================================
            // 📅 METADATA TRANSAKSI
            // ==========================================
            printer.alignLeft();
            printer.setTextSize(0, 0);
            
            // Helper baris rapi
            const row = (key, val) => {
                printer.tableCustom([
                    { text: key, align: "LEFT", width: 0.35 },   // 35% Lebar
                    { text: ": " + val, align: "LEFT", width: 0.65 } // 65% Lebar
                ]);
            };

            const tgl = new Date().toLocaleString('id-ID', { 
                day: 'numeric', month: 'numeric', year: '2-digit', 
                hour: '2-digit', minute: '2-digit' 
            });

            row("Tgl", tgl);
            row("Reff", `#${data.id.toString().slice(-6)}`);
            row("Cust", (data.pushname || "Guest").slice(0, 15)); // Potong jika kepanjangan
            
            printer.println("--------------------------------");

            // ==========================================
            // 🛒 ITEM BELANJA
            // ==========================================
            printer.bold(true);
            printer.println("DETAIL ITEM");
            printer.bold(false);
            
            // Nama Item
            printer.alignLeft();
            printer.println(data.item.toUpperCase());
            
            // Harga (Rata Kanan)
            printer.alignRight();
            printer.println(data.nominal);
            
            printer.println("--------------------------------");

            // ==========================================
            // 💰 TOTAL & STATUS
            // ==========================================
            printer.bold(true);
            printer.tableCustom([
                { text: "TOTAL BAYAR", align: "LEFT", width: 0.50 },
                { text: data.nominal, align: "RIGHT", width: 0.50 }
            ]);
            printer.bold(false);

            printer.newLine();

            // Status LUNAS (Kotak Tebal)
            printer.alignCenter();
            printer.invert(true);
            printer.setTextSize(1, 1); // Font Besar
            printer.println("   L U N A S   ");
            printer.setTextSize(0, 0); // Reset Font
            printer.invert(false);

            // ==========================================
            // 🦶 FOOTER
            // ==========================================
            printer.newLine();
            printer.println("================================");
            printer.alignCenter();
            printer.println("Terima kasih atas kepercayaan");
            printer.println("Anda menggunakan layanan kami.");
            printer.newLine();
            printer.println("* Simpan struk ini *");
            printer.println("* sebagai bukti sah *");
            printer.newLine();
            printer.newLine(); // Space buat sobek kertas
            
            printer.cut(); 
            printer.beep(); 

            // ==========================================
            // 📤 KIRIM KE PRINTER
            // ==========================================
            const buffer = printer.getBuffer();
            fs.writeFile(PRINTER_PATH, buffer, (err) => {
                if (err) {
                    console.error("❌ Gagal Print:", err.message);
                } else {
                    console.log("🖨️ Struk 58mm Tercentak!");
                }
            });

        } catch (error) {
            console.error("❌ Error Printer:", error.message);
        }
    }
};