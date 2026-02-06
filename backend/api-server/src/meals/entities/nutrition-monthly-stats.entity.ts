import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('nutrition_monthly_stats')
@Index(['userId', 'month', 'year'], { unique: true })
export class NutritionMonthlyStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ type: 'int', nullable: false })
  month: number; // 1-12

  @Column({ type: 'int', nullable: false })
  year: number;

  @Column({ type: 'date', nullable: false })
  monthStart: Date;

  @Column({ type: 'date', nullable: false })
  monthEnd: Date;

  // Average daily values
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgCalories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgProtein: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgCarbohydrates: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgFat: number;

  // Total monthly values
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCalories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProtein: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCarbohydrates: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFat: number;

  // Micronutrients totals
  @Column('simple-json', { nullable: true, default: {} })
  totalMicronutrients?: Record<string, number>;

  // Tracking stats
  @Column({ type: 'int', default: 0 })
  daysTracked: number;

  @Column({ type: 'int', default: 0 })
  totalDaysInMonth: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  trackingPercentage: number; // (daysTracked / totalDaysInMonth) * 100

  @Column({ type: 'int', default: 0 })
  goalStreakDays: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  // Meal distribution totals
  @Column({ type: 'int', default: 0 })
  totalBreakfastCalories: number;

  @Column({ type: 'int', default: 0 })
  totalLunchCalories: number;

  @Column({ type: 'int', default: 0 })
  totalDinnerCalories: number;

  @Column({ type: 'int', default: 0 })
  totalSnackCalories: number;

  // Weekly breakdown (stored as JSON for easy querying)
  @Column('simple-json', { nullable: true, default: [] })
  weeklyBreakdown?: Array<{
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    totalCalories: number;
    avgCalories: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
