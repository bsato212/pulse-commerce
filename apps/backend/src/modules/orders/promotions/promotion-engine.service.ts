import { Injectable, Logger } from '@nestjs/common';
import {
  PromotionContext,
  PromotionDiscountResult,
  PromotionRuleStrategy,
} from './promotion-rule.interface';

@Injectable()
export class PromotionEngineService {
  private readonly logger = new Logger(PromotionEngineService.name);
  private readonly registeredRules: PromotionRuleStrategy[] = [];

  registerRule(rule: PromotionRuleStrategy) {
    this.registeredRules.push(rule);
    this.registeredRules.sort((a, b) => b.priority - a.priority);
    this.logger.log(
      `Registered promotion rule strategy: ${rule.code} (priority: ${rule.priority})`,
    );
  }

  async calculatePromotions(context: PromotionContext): Promise<PromotionDiscountResult[]> {
    const appliedDiscounts: PromotionDiscountResult[] = [];

    for (const rule of this.registeredRules) {
      try {
        const result = await rule.evaluate(context);
        if (result && result.discountAmount > 0) {
          appliedDiscounts.push(result);
        }
      } catch (err: any) {
        this.logger.error(`Error evaluating promotion rule ${rule.code}: ${err.message}`);
      }
    }

    return appliedDiscounts;
  }
}
