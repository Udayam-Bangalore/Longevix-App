import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class FoodItem {
  name: string;

  quantity: number;

  unit: string;

  id?: string;

  calories: number;

  fat: number;

  protein: number;

  carbohydrates: number;

  micronutrients?: Record<string, number>;
}

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  name: string;

  @Column('simple-json', { default: [] })
  items: FoodItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  calories: number;

  @Column('simple-json', { nullable: true, default: {} })
  micronutrients?: Record<string, number>;

  @Column({ nullable: false })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
