import { CmsEntry, TranslationSet } from "../types";

// Industry-Standard iGaming Dictionary
const INDUSTRY_DICT: Record<string, Record<string, string>> = {
  "Deposit": { cn: "充值", kh: "ដាក់ប្រាក់", id: "Setoran", vn: "Gửi tiền", th: "ฝากเงิน", my: "Deposit" },
  "Withdraw": { cn: "提现", kh: "ដកប្រាក់", id: "Penarikan", vn: "Rút tiền", th: "ถอนเงิน", my: "Pengeluaran" },
  "Spin": { cn: "旋转", kh: "វិល", id: "Putar", vn: "Quay", th: "หมุน", my: "Putar" },
  "Bet": { cn: "投注", kh: "ភ្នាល់", id: "Taruhan", vn: "Đặt cược", th: "วางเดิมพัน", my: "Pertaruhan" },
  "Balance": { cn: "余额", kh: "សមតុល្យ", id: "Saldo", vn: "Số dư", th: "ยอดคงเหลือ", my: "Baki" },
  "Bonus": { cn: "奖金", kh: "ប្រាក់រង្វាន់", id: "Bonus", vn: "Tiền thưởng", th: "โบนัส", my: "Bonus" },
  "Jackpot": { cn: "大奖", kh: "ជែកផត", id: "Jackpot", vn: "Giải độc đắc", th: "แจ็คพอต", my: "Jackpot" },
  "Promotion": { cn: "优惠", kh: "ការផ្សព្វផ្សាយ", id: "Promosi", vn: "Khuyến mãi", th: "โปรโมชั่น", my: "Promosi" },
  "Turnover": { cn: "流水", kh: "ចរាចរណ៍សាច់ប្រាក់", id: "Perputaran", vn: "Doanh thu", th: "ยอดเทิร์นโอเวอร์", my: "Turnover" },
  "Rebate": { cn: "返水", kh: "ការបង្វិលប្រាក់", id: "Rabat", vn: "Hoàn trả", th: "คืนเงิน", my: "Rebat" },
  "KYC Verification": { cn: "实名认证", kh: "ការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ", id: "Verifikasi KYC", vn: "Xác minh danh tính", th: "การยืนยันตัวตน", my: "Pengesahan KYC" },
  "Odds": { cn: "赔率", kh: "ហាងឆេង", id: "Peluang", vn: "Tỷ lệ cược", th: "อัตราต่อรอง", my: "Odds" },
  "Login": { cn: "登录", kh: "ចូល", id: "Masuk", vn: "Đăng nhập", th: "เข้าสู่ระบบ", my: "Log Masuk" },
  "Register": { cn: "注册", kh: "ចុះឈ្មោះ", id: "Daftar", vn: "Đăng ký", th: "ลงทะเบียน", my: "Daftar" },
  "Confirm": { cn: "确认", kh: "បញ្ជាក់", id: "Konfirmasi", vn: "Xác nhận", th: "ยืนยัน", my: "Sahkan" },
  "Insufficient Balance": { cn: "余额不足", kh: "សមតុល្យមិនគ្រប់គ្រាន់", id: "Saldo Tidak Cukup", vn: "Số dư không đủ", th: "ยอดเงินไม่เพียงพอ", my: "Baki Tidak Mencukupi" },
  "Daily Mission": { cn: "每日任务", kh: "បេសកកម្មប្រចាំថ្ងៃ", id: "Misi Harian", vn: "Nhiệm vụ hàng ngày", th: "ภารกิจรายวัน", my: "Misi Harian" },
  "VIP Level": { cn: "VIP等级", kh: "កម្រិត VIP", id: "Level VIP", vn: "Cấp độ VIP", th: "ระดับ VIP", my: "Tahap VIP" },
  "Play Now": { cn: "立即开始", kh: "លេងឥឡូវនេះ", id: "Main Sekarang", vn: "Chơi ngay", th: "เล่นเลย", my: "Main Sekarang" },
  "History": { cn: "记录", kh: "ប្រវត្តិ", id: "Riwayat", vn: "Lịch sử", th: "ประวัติ", my: "Sejarah" },
  "Bank Card": { cn: "银行卡", kh: "កាតធនាគារ", id: "Kartu Bank", vn: "Thẻ ngân hàng", th: "บัตรธนาคาร", my: "Kad Bank" },
  "Stake": { cn: "本金", kh: "ប្រាក់ដើម", id: "Taruhan Utama", vn: "Tiền cược", th: "เงินเดิมพัน", my: "Stake" }
};

const CATEGORY_MAP: Record<string, string[]> = {
  BANKING: ["deposit", "withdraw", "balance", "bank", "wallet", "transfer", "pay", "card"],
  GAMES: ["spin", "play", "jackpot", "bet", "win", "slot", "dealer", "odds", "stake", "multiplier"],
  ACCOUNT: ["login", "register", "profile", "settings", "password", "kyc", "user", "verify"],
  PROMO: ["bonus", "promotion", "rebate", "mission", "event", "gift", "vip", "rewards", "turnover"],
  SYSTEM: ["error", "success", "confirm", "cancel", "loading", "network", "invalid"]
};

export const mockGenerateCmsEntry = async (text: string): Promise<Omit<CmsEntry, 'id' | 'timestamp'>> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 800));

  const lowerText = text.toLowerCase();
  
  // 1. Determine Category through keyword detection
  let category = "COMMON";
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lowerText.includes(k))) {
      category = cat;
      break;
    }
  }

  // 2. Generate a clean, readable short code
  const cleanBase = text.trim().replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 2).join('_').toUpperCase();
  const code = `${category === 'GAMES' ? 'GME' : category.substring(0, 3)}_${cleanBase || 'ACTION'}_${Math.floor(Math.random() * 900) + 100}`;
  
  // 3. Find accurate match or fallback
  const matchKey = Object.keys(INDUSTRY_DICT).find(k => k.toLowerCase() === lowerText) || 
                   Object.keys(INDUSTRY_DICT).find(k => lowerText.includes(k.toLowerCase())) || 
                   null;

  const translations: TranslationSet = {
    en: text || "Untitled Action",
    cn: matchKey ? INDUSTRY_DICT[matchKey].cn : `[ZH] ${text}`,
    kh: matchKey ? INDUSTRY_DICT[matchKey].kh : `[KH] ${text}`,
    id: matchKey ? INDUSTRY_DICT[matchKey].id : `[ID] ${text}`,
    vn: matchKey ? INDUSTRY_DICT[matchKey].vn : `[VN] ${text}`,
    th: matchKey ? INDUSTRY_DICT[matchKey].th : `[TH] ${text}`,
    my: matchKey ? INDUSTRY_DICT[matchKey].my : `[MY] ${text}`,
  };

  return {
    key1: category,
    key2: code,
    translations
  };
};

export const mockRefineText = async (lang: string, current: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Provides variations for common actions
  const variations: Record<string, string[]> = {
    cn: ["确 认", "确定提交", "立即执行"],
    vn: ["Xác nhận", "Đồng ý", "Hoàn tất ngay"],
    th: ["ยืนยันการทำรายการ", "ตกลง", "ดำเนินการต่อ"]
  };
  
  const pool = variations[lang] || [`${current} (Official)`, `${current} (System)`];
  return pool[Math.floor(Math.random() * pool.length)];
};
