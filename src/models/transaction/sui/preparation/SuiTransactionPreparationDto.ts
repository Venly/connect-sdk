import GasPriceDto from './GasPriceDto';

export default class SuiTransactionPreparationDto {
    public gasPrices!: GasPriceDto[];
    public gasBudget!: number;
}
