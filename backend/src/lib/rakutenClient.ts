import { HttpClient } from "./httpClient";
import { ENV } from "../config/env";
import { logger } from "./logger";
import type { RakutenItem } from "../types/rakuten";

// 楽天市場商品検索API クライアント
// https://webservice.rakuten.co.jp/api/ichibaitemsearch/
export class RakutenClient extends HttpClient {
  constructor() {
    super("https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601");
  }

  async searchItems(keyword: string, hits: number = 3): Promise<RakutenItem[]> {
    if (!keyword) return [];

    try {
      const res = await this.client.get("", {
        params: {
          applicationId: ENV.rakutenAppId,
          keyword,
          hits,
          imageFlag: 1,
          affiliateId: ENV.rakutenAffiliateId
        }
      });

      const items: RakutenItem[] = (res.data.Items || []).map((wrap: any) => {
        const item = wrap.Item;
        return {
          name: item.itemName,
          url: item.itemUrl,
          image: item.mediumImageUrls?.[0]?.imageUrl || item.smallImageUrls?.[0]?.imageUrl || "",
          price: item.itemPrice,
          shop: item.shopName
        };
      });

      return items;
    } catch (err) {
      logger.error({ keyword, hits }, "Rakuten search failed");
      return [];
    }
  }
}

export const rakutenClient = new RakutenClient();
