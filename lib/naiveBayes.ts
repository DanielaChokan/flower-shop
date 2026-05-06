import { CustomerType } from "./api";

export type CustomerFeatures = {
  orderCount: number;
  totalSpend: number;
  avgOrderValue: number;
  hasGiftKeyword: boolean;
};

type GaussianParams = { mean: number; variance: number };

type ClassParams = {
  prior: number;
  orderCount: GaussianParams;
  totalSpend: GaussianParams;
  avgOrderValue: GaussianParams;
  hasGiftKeyword: number;
};

const MODEL: Record<CustomerType, ClassParams> = {
  oneTimePurchase: {
    prior: 0.4,
    orderCount:    { mean: 1,    variance: 0.25  },
    totalSpend:    { mean: 500,  variance: 90000 },
    avgOrderValue: { mean: 500,  variance: 90000 },
    hasGiftKeyword: 0.15,
  },
  giftOrder: {
    prior: 0.35,
    orderCount:    { mean: 2,    variance: 1     },
    totalSpend:    { mean: 1200, variance: 160000 },
    avgOrderValue: { mean: 700,  variance: 90000  },
    hasGiftKeyword: 0.65,
  },
  regularCustomer: {
    prior: 0.25,
    orderCount:    { mean: 6,    variance: 4     },
    totalSpend:    { mean: 3500, variance: 640000 },
    avgOrderValue: { mean: 600,  variance: 40000  },
    hasGiftKeyword: 0.2,
  },
};

function gaussianPdf(x: number, { mean, variance }: GaussianParams): number {
  const sigma2 = variance;
  const exponent = -((x - mean) ** 2) / (2 * sigma2);
  return (1 / Math.sqrt(2 * Math.PI * sigma2)) * Math.exp(exponent);
}

function clamp(p: number): number {
  return Math.max(p, 1e-10);
}

export function classifyCustomer(features: CustomerFeatures): {
  customerType: CustomerType;
  confidence: number;
  scores: Record<CustomerType, number>;
} {
  const classes = Object.keys(MODEL) as CustomerType[];

  const logScores: Record<CustomerType, number> = {} as Record<CustomerType, number>;

  for (const cls of classes) {
    const params = MODEL[cls];

    const logPrior = Math.log(params.prior);
    const logOrderCount  = Math.log(clamp(gaussianPdf(features.orderCount,    params.orderCount)));
    const logTotalSpend  = Math.log(clamp(gaussianPdf(features.totalSpend,     params.totalSpend)));
    const logAvgOrder    = Math.log(clamp(gaussianPdf(features.avgOrderValue,  params.avgOrderValue)));

    const pKeyword = features.hasGiftKeyword
      ? params.hasGiftKeyword
      : 1 - params.hasGiftKeyword;
    const logKeyword = Math.log(clamp(pKeyword));

    logScores[cls] = logPrior + logOrderCount + logTotalSpend + logAvgOrder + logKeyword;
  }

  const maxLog = Math.max(...Object.values(logScores));
  const expScores: Record<CustomerType, number> = {} as Record<CustomerType, number>;
  let sumExp = 0;
  for (const cls of classes) {
    expScores[cls] = Math.exp(logScores[cls] - maxLog);
    sumExp += expScores[cls];
  }
  const probabilities: Record<CustomerType, number> = {} as Record<CustomerType, number>;
  for (const cls of classes) {
    probabilities[cls] = expScores[cls] / sumExp;
  }

  const predicted = classes.reduce((best, cls) =>
    probabilities[cls] > probabilities[best] ? cls : best
  );

  return {
    customerType: predicted,
    confidence: probabilities[predicted],
    scores: probabilities,
  };
}

export function buildCustomerFeatures(orders: {
  totalPrice: number;
  comment?: string | null;
}[]): CustomerFeatures {
  const orderCount = orders.length;
  const totalSpend = orders.reduce((s, o) => s + o.totalPrice, 0);
  const avgOrderValue = orderCount > 0 ? totalSpend / orderCount : 0;

  const giftKeywords = ["подарун", "gift", "дарунок", "сюрприз", "surprise"];
  const hasGiftKeyword = orders.some((o) =>
    giftKeywords.some((kw) => (o.comment ?? "").toLowerCase().includes(kw))
  );

  return { orderCount, totalSpend, avgOrderValue, hasGiftKeyword };
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  oneTimePurchase: "Разова покупка",
  giftOrder: "Подарункове замовлення",
  regularCustomer: "Постійний клієнт",
};

export const REGULAR_CUSTOMER_DISCOUNT = 0.1;
