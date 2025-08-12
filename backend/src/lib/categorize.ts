const rules = {
    'Income': [/SALARY/i, /INTEREST/i, /CREDIT/i],
    'Food & Dining': [/ZOMATO/i, /SWIGGY/i, /RESTAURANT/i, /DOMINOS/i],
    'Transport': [/OLA/i, /UBER/i, /RAPIDO/i, /METRO/i, /AUTO/i],
    'Shopping': [/FLIPKART/i, /AMAZON/i, /MYNTRA/i, /AJIO/i, /SHOPPERS STOP/i],
    'Entertainment & Subscriptions': [/NETFLIX/i, /AMAZON PRIME/i, /PRIME VIDEO/i, /SPOTIFY/i, /BOOKMYSHOW/i, /PVR/i],
    'Bills & Utilities': [/BESCOM/, /BSNL/, /AIRTEL/, /VODAFONE/, /ELECTRICITY/, /JIO/, /WATER BILL/i, /GAS/i],
    'Groceries': [/BLINKIT/i, /ZEPTO/i, /BIGBASKET/i, /GROCERY/i],
    'Health & Wellness': [/APOLLO PHARMACY/i, /1MG/i, /PHARMEASY/i, /CULT.FIT/i],
    'UPI Transfer': [/UPI\//],
    'Investments': [/ZERODHA/i, /GROWW/i, /UPSTOX/i],
  };
  
  export const categorizeTransaction = (description: string): string => {
    for (const category in rules) {
      for (const rule of rules[category as keyof typeof rules]) {
        if (rule.test(description.toUpperCase())) {
          return category;
        }
      }
    }
    return 'Miscellaneous'; // Default category if no rule matches
  };