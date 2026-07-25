import { eq } from 'drizzle-orm';
import { client, db } from './drizzle';
import { products } from './schema';

// 冪等種子：以商品 name 唯一性判斷。不存在則建立；已存在則回填 detail/description/image_url
// （不覆蓋既有 price/active，避免蓋掉店主手動改過的值）。重跑會收斂到相同狀態。
const SEED_PRODUCTS = [
  {
    name: 'Acme Pro 授權',
    price: 990,
    active: true,
    description:
      '一次購買、永久使用的 Acme Pro 授權。包含完整功能與後續更新。',
    detail: `Acme Pro 是專為個人創作者打造的完整授權方案。一次購買、永久使用，沒有月租，也沒有隱藏費用。

你會得到什麼：
・完整功能解鎖，不限使用時間
・後續版本更新，持續進化
・優先的問題回覆與支援

無論你要銷售課程、數位作品或專業服務，Acme Pro 都能讓你在幾分鐘內完成上架與收款，把心力留給真正重要的作品本身。`,
    imageUrl: null as string | null,
  },
  {
    name: '數位商品開店實戰課',
    price: 1280,
    active: true,
    description: '六個章節，帶你從零開出一間能收款的數位商品店。',
    detail: `這是一堂給個人創作者的實作課程。不談抽象的行銷理論，只帶你把一間真的能收款的店開起來。

課程章節：
・選品：什麼樣的數位商品賣得動
・定價：一次購買與訂閱該怎麼選
・上架：把作品變成商品頁的實際流程
・金流：串接台灣金流的前置準備與常見卡關
・成交：讓人願意按下購買鍵的頁面結構
・出貨：付款完成後的自動化交付

全長約四小時，含逐章的實作清單。購買後永久觀看，後續更新免費。`,
    imageUrl: null as string | null,
  },
  {
    name: '落地頁範本包',
    price: 590,
    active: true,
    description: '八套可直接套用的落地頁版型，含繁中文案骨架。',
    detail: `八套為數位商品設計的落地頁版型，涵蓋課程、電子書、範本、訂閱制等常見情境。

包含內容：
・八套完整版型，響應式排版
・每套皆附繁體中文的文案骨架，照著填就有結構
・明暗色兩種配色
・可自由修改、商用不限件數

適合已經有作品、但卡在「不知道頁面該怎麼排」的創作者。下載後即可使用，不需要設計基礎。`,
    imageUrl: null as string | null,
  },
];

async function seed() {
  for (const item of SEED_PRODUCTS) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.name, item.name))
      .limit(1);

    if (existing) {
      await db
        .update(products)
        .set({
          description: item.description,
          detail: item.detail,
          imageUrl: item.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existing.id));
      console.log(`已更新（回填 detail/描述）：${item.name}`);
      continue;
    }

    await db.insert(products).values(item);
    console.log(`已建立：${item.name}`);
  }
}

seed()
  .then(async () => {
    await client.end();
    console.log('種子完成。');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('種子失敗：', error);
    await client.end().catch(() => {});
    process.exit(1);
  });
