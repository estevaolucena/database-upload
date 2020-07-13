import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

let checkedCategory;

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const transactions = await transactionsRepository.find();

    const { total } = await transactionsRepository.getBalance(transactions);

    if (type === 'outcome' && value > total) {
      throw new AppError('Do you not have enought cash.', 400);
    }

    const checkCategoryExists = await categoriesRepository.findOne({
      title: category,
    });

    checkedCategory = checkCategoryExists;

    if (!checkCategoryExists) {
      const newCategory = categoriesRepository.create({
        title: category,
      });
      checkedCategory = await categoriesRepository.save(newCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: checkedCategory?.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
