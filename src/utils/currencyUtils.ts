export const formatAsCurrency = (value: number) => {
    return Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "CAD", // TODO, make currency a user setting
        currencyDisplay: "narrowSymbol",
    }).format(value);
};
