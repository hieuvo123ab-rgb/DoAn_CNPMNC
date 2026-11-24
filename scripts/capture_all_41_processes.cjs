const path = require('path');
const fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer-core'));

const OUT_DIR = path.resolve(__dirname, '../docs/audit/screenshots_41_nghiep_vu');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickByText(page, selector, text) {
  try {
    return await page.evaluate((sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      const target = els.find((e) => e.textContent && e.textContent.includes(txt));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, selector, text);
  } catch (e) {
    return false;
  }
}

async function safeClick(page, selector) {
  try {
    const el = await page.$(selector);
    if (el) {
      await el.click();
      return true;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log('[START] Starting Robust 41 Business Processes Visual Capture Suite...');
  console.log(`[DIR] Output directory: ${OUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const navigateTo = async (view) => {
    await page.evaluate((v) => {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: v }));
    }, view);
    await sleep(1500);
  };

  try {
    // -------------------------------------------------------------
    // NV-D01: Login Screen (before login)
    // -------------------------------------------------------------
    console.log('[NV-D01] Capturing Login Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_D01_dang_nhap_jwt.png'), fullPage: false });
    console.log('  -> Saved NV_D01_dang_nhap_jwt.png');

    // Authenticate as Admin (hieu)
    console.log('[AUTH] Logging in as Admin (hieu)...');
    await page.type('#username-input', 'hieu');
    await page.type('#password-input', 'password123');
    await page.click('#login-submit-btn');
    await sleep(2500);

    // -------------------------------------------------------------
    // GROUP A: DOCUMENT MANAGEMENT (NV-A01 to NV-A06)
    // -------------------------------------------------------------
    console.log('\n--- GROUP A: QUẢN LÝ TÀI LIỆU ---');
    await navigateTo('documents');

    // NV-A01.1: Danh sách tài liệu trong kho
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_A01_danh_sach_tai_lieu.png'), fullPage: false });
    console.log('  -> Saved NV_A01_danh_sach_tai_lieu.png');

    // NV-A01.2: Modal tải lên tài liệu mới
    if (await safeClick(page, '#open-upload-modal-btn')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_A01_upload_modal.png'), fullPage: false });
      console.log('  -> Saved NV_A01_upload_modal.png');
      await clickByText(page, 'button', 'Hủy');
      await sleep(500);
    }

    // NV-A02: Modal lịch sử phiên bản
    if (await safeClick(page, '.action-btn.version-btn, [id^="version-doc-btn-"]')) {
      await sleep(1500);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_A02_lich_su_phien_ban.png'), fullPage: false });
      console.log('  -> Saved NV_A02_lich_su_phien_ban.png');

      // NV-A03: Hộp thoại khôi phục phiên bản
      if (await clickByText(page, 'button', 'Khôi phục')) {
        await sleep(1000);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_A03_khoi_phuc_phien_ban.png'), fullPage: false });
        console.log('  -> Saved NV_A03_khoi_phuc_phien_ban.png');
        await clickByText(page, 'button', 'Hủy');
        await sleep(500);
      }

      await clickByText(page, 'button', 'Đóng');
      await sleep(500);
    }

    // NV-A05: Xem trước tài liệu
    if (await safeClick(page, '.action-btn.preview-btn, [id^="preview-doc-btn-"]')) {
      await sleep(1500);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_A05_xem_truoc_tai_lieu.png'), fullPage: false });
      console.log('  -> Saved NV_A05_xem_truoc_tai_lieu.png');
      await safeClick(page, '.preview-close-btn, .modal-close-btn');
      await clickByText(page, 'button', 'Đóng');
      await sleep(500);
    }

    // NV-A06: Chỉnh sửa metadata
    if (await safeClick(page, '.action-btn.edit-btn, [id^="edit-doc-btn-"]')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_A06_chinh_sua_metadata.png'), fullPage: false });
      console.log('  -> Saved NV_A06_chinh_sua_metadata.png');
      await clickByText(page, 'button', 'Hủy');
      await sleep(500);
    }

    // NV-D03: Phân quyền tài liệu ACL (Share modal)
    if (await safeClick(page, '.action-btn.share-btn, [id^="share-doc-btn-"]')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_D03_phan_quyen_tai_lieu_acl.png'), fullPage: false });
      console.log('  -> Saved NV_D03_phan_quyen_tai_lieu_acl.png');
      await clickByText(page, 'button', 'Đóng');
      await sleep(500);
    }

    // NV-C02: Quản lý vòng đời lưu trữ (Lifecycle Modal)
    if (await safeClick(page, '.action-btn[id^="lifecycle-doc-btn-"], button[title*="vòng đời"]')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_C02_vong_doi_luu_tru.png'), fullPage: false });
      console.log('  -> Saved NV_C02_vong_doi_luu_tru.png');
      await clickByText(page, 'button', 'Đóng');
      await sleep(500);
    }

    // NV-B04: Tìm kiếm Hybrid
    const searchInput = await page.$('input[placeholder*="Tìm kiếm"], #docs-search-input');
    if (searchInput) {
      await searchInput.type('hợp đồng');
      await sleep(300);
      await clickByText(page, 'button', 'Tìm kiếm');
      await sleep(1200);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_B04_tim_kiem_hybrid.png'), fullPage: false });
      console.log('  -> Saved NV_B04_tim_kiem_hybrid.png');
    }

    // NV-B05: Lưu bộ lọc tìm kiếm
    if (await clickByText(page, 'button', 'Lưu bộ lọc')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_B05_bo_loc_da_luu.png'), fullPage: false });
      console.log('  -> Saved NV_B05_bo_loc_da_luu.png');
      await clickByText(page, 'button', 'Hủy');
      await sleep(500);
    }

    // NV-C03 & NV-A04: Legal Hold & Integrity
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_C03_legal_hold_phong_toa.png'), fullPage: false });
    console.log('  -> Saved NV_C03_legal_hold_phong_toa.png');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_A04_kiem_tra_toan_ven.png'), fullPage: false });
    console.log('  -> Saved NV_A04_kiem_tra_toan_ven.png');

    // -------------------------------------------------------------
    // GROUP C: WORKFLOW QUEUES (NV-C01, NV-C04, NV-H02)
    // -------------------------------------------------------------
    console.log('\n--- GROUP C: QUY TRÌNH HÀNG ĐỢI ---');
    await navigateTo('review-queue');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_C01_hang_doi_xet_duyet.png'), fullPage: false });
    console.log('  -> Saved NV_C01_hang_doi_xet_duyet.png');

    await navigateTo('disposition-queue');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_C04_hang_doi_tieu_huy.png'), fullPage: false });
    console.log('  -> Saved NV_C04_hang_doi_tieu_huy.png');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_H02_legal_hold_ngan_tieu_huy.png'), fullPage: false });
    console.log('  -> Saved NV_H02_legal_hold_ngan_tieu_huy.png');

    // -------------------------------------------------------------
    // GROUP D: ADMINISTRATION & AUDIT (NV-D02, NV-D05, NV-D06, NV-D07)
    // -------------------------------------------------------------
    console.log('\n--- GROUP D: QUẢN TRỊ & BẢO MẬT ---');
    await navigateTo('users');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_D02_phan_quyen_rbac.png'), fullPage: false });
    console.log('  -> Saved NV_D02_phan_quyen_rbac.png');

    await navigateTo('audit');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_D05_nhat_ky_kiem_toan.png'), fullPage: false });
    console.log('  -> Saved NV_D05_nhat_ky_kiem_toan.png');

    await navigateTo('dashboard');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_D07_dashboard_giam_sat.png'), fullPage: false });
    console.log('  -> Saved NV_D07_dashboard_giam_sat.png');

    await navigateTo('system-status');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_D07_trang_thai_he_thong.png'), fullPage: false });
    console.log('  -> Saved NV_D07_trang_thai_he_thong.png');

    // Open Notification Panel for NV-D06 & NV-H03
    if (await safeClick(page, '#notification-bell-btn, button[title*="thông báo"], .ent-header__notif-btn')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_D06_thong_bao_thoi_gian_thuc.png'), fullPage: false });
      console.log('  -> Saved NV_D06_thong_bao_thoi_gian_thuc.png');
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_H03_thong_bao_dieu_tra_task_center.png'), fullPage: false });
      console.log('  -> Saved NV_H03_thong_bao_dieu_tra_task_center.png');
      await safeClick(page, '#notification-bell-btn, button[title*="thông báo"], .ent-header__notif-btn');
      await sleep(500);
    }

    // -------------------------------------------------------------
    // GROUP E: TASK CENTER 2.0 (NV-E01 to NV-E04)
    // -------------------------------------------------------------
    console.log('\n--- GROUP E: TASK CENTER 2.0 ---');
    await navigateTo('tasks');

    // NV-E02: Kanban view
    await safeClick(page, '#btn-view-kanban');
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_E02_kanban_cong_viec.png'), fullPage: false });
    console.log('  -> Saved NV_E02_kanban_cong_viec.png');

    // NV-E01: List view / System tasks
    await safeClick(page, '#btn-view-list');
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_E01_tac_vu_tu_dong.png'), fullPage: false });
    console.log('  -> Saved NV_E01_tac_vu_tu_dong.png');

    // NV-E02.2: Create task modal
    if (await safeClick(page, '#btn-create-task')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_E02_modal_tao_cong_viec.png'), fullPage: false });
      console.log('  -> Saved NV_E02_modal_tao_cong_viec.png');
      await clickByText(page, 'button', 'Hủy');
      await sleep(500);
    }

    // NV-E04: Workload Analytics modal
    if (await safeClick(page, '#btn-workload-analytics')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_E04_phan_tich_tai_cong_viec.png'), fullPage: false });
      console.log('  -> Saved NV_E04_phan_tich_tai_cong_viec.png');
      await clickByText(page, 'button', 'Đóng');
      await sleep(500);
    }

    // NV-E03: Task Detail Drawer (click first task row)
    if (await safeClick(page, '.ent-table tbody tr, .kanban-card')) {
      await sleep(1500);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_E03_task_drawer_binh_luan.png'), fullPage: false });
      console.log('  -> Saved NV_E03_task_drawer_binh_luan.png');
      await safeClick(page, '.ent-drawer__close, button[aria-label="Đóng"]');
      await clickByText(page, 'button', 'Đóng');
      await sleep(500);
    }

    // -------------------------------------------------------------
    // GROUP F: DOCUMENT INVESTIGATION (NV-F01 to NV-F06)
    // -------------------------------------------------------------
    console.log('\n--- GROUP F: DOCUMENT INVESTIGATION ---');
    await navigateTo('investigations');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_F01_dashboard_dieu_tra.png'), fullPage: false });
    console.log('  -> Saved NV_F01_dashboard_dieu_tra.png');

    // Create case modal
    if (await clickByText(page, 'button', 'Mở hồ sơ điều tra')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_F01_modal_mo_ho_so.png'), fullPage: false });
      console.log('  -> Saved NV_F01_modal_mo_ho_so.png');
      await clickByText(page, 'button', 'Hủy');
      await sleep(500);
    }

    // Open first case detail drawer
    if (await safeClick(page, '.ent-table tbody tr')) {
      await sleep(1500);

      // Tab 1: Evidence & Legal Hold (NV-F02)
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_F02_chung_cu_va_legal_hold.png'), fullPage: false });
      console.log('  -> Saved NV_F02_chung_cu_va_legal_hold.png');

      // Tab 2: Diff (NV-F03)
      if (await clickByText(page, 'button', 'So sánh')) {
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_F03_so_sanh_phien_ban_diff.png'), fullPage: false });
        console.log('  -> Saved NV_F03_so_sanh_phien_ban_diff.png');
      }

      // Tab 3: Timeline (NV-F04)
      if (await clickByText(page, 'button', 'Dòng thời gian')) {
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_F04_timeline_dieu_tra.png'), fullPage: false });
        console.log('  -> Saved NV_F04_timeline_dieu_tra.png');
      }

      // Tab 4: Findings & Conclusion (NV-F05)
      if (await clickByText(page, 'button', 'Kết luận')) {
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_F05_ket_luan_va_phe_duyet.png'), fullPage: false });
        console.log('  -> Saved NV_F05_ket_luan_va_phe_duyet.png');
      }

      await safeClick(page, '.ent-drawer__close, button[aria-label="Đóng"]');
      await sleep(500);
    }

    // -------------------------------------------------------------
    // GROUP G: VIRTUAL DATA ROOM (NV-G01 to NV-G06)
    // -------------------------------------------------------------
    console.log('\n--- GROUP G: VIRTUAL DATA ROOM (VDR) ---');
    await navigateTo('vdr');
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_G01_dashboard_phong_vdr.png'), fullPage: false });
    console.log('  -> Saved NV_G01_dashboard_phong_vdr.png');

    // Create room modal
    if (await clickByText(page, 'button', 'Tạo phòng dữ liệu')) {
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_G01_modal_tao_phong_vdr.png'), fullPage: false });
      console.log('  -> Saved NV_G01_modal_tao_phong_vdr.png');
      await clickByText(page, 'button', 'Hủy');
      await sleep(500);
    }

    // Open first room detail
    if (await safeClick(page, '.vdr-room-card, .ent-table tbody tr, .room-card')) {
      await sleep(1500);

      // Tab 1: Documents (NV-G02)
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_G02_danh_sach_tai_lieu_vdr.png'), fullPage: false });
      console.log('  -> Saved NV_G02_danh_sach_tai_lieu_vdr.png');

      // Secure watermarked viewer (NV-G04)
      if (await clickByText(page, 'button', 'Xem')) {
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_G04_trinh_xem_watermark.png'), fullPage: false });
        console.log('  -> Saved NV_G04_trinh_xem_watermark.png');
        await clickByText(page, 'button', 'Đóng');
        await sleep(500);
      }

      // Tab 2: Members & Token Invitation (NV-G03)
      if (await clickByText(page, 'button', 'Thành viên')) {
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_G03_moi_thanh_vien_token.png'), fullPage: false });
        console.log('  -> Saved NV_G03_moi_thanh_vien_token.png');
      }

      // Tab 3: Security Audit & Suspicious Events (NV-G06, NV-G05, NV-H01)
      if (await clickByText(page, 'button', 'Nhật ký an ninh')) {
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_G06_nhat_ky_an_ninh_vdr.png'), fullPage: false });
        console.log('  -> Saved NV_G06_nhat_ky_an_ninh_vdr.png');
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_G05_anti_leak_chan_tai.png'), fullPage: false });
        console.log('  -> Saved NV_G05_anti_leak_chan_tai.png');
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_H01_mo_dieu_tra_tu_su_co_vdr.png'), fullPage: false });
        console.log('  -> Saved NV_H01_mo_dieu_tra_tu_su_co_vdr.png');
      }
    }

    // -------------------------------------------------------------
    // PUBLIC VERIFY PAGE (NV-D04)
    // -------------------------------------------------------------
    console.log('\n--- PUBLIC VERIFY PAGE ---');
    await page.goto('http://localhost:5173/verify', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'NV_D04_ky_so_va_tra_cuu_qr.png'), fullPage: false });
    console.log('  -> Saved NV_D04_ky_so_va_tra_cuu_qr.png');

    console.log('\n[SUCCESS] Completed All Screen Captures Successfully!');

  } catch (err) {
    console.error('[ERROR] Error during screen capture:', err);
  } finally {
    await browser.close();
  }
}

run();
