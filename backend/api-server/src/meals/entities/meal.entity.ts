import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export class FoodItem {
  @Column()
  name: string;

  @Column()
  quantity: string;

  @Column()
  unit: string;

  @Column({ nullable: true })
  id?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  calories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fat: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  protein: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carbohydrates: number;

  @Column('simple-json', { nullable: true, default: {} })
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

  @Column({ default: 0 })
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
