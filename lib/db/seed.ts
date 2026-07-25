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
