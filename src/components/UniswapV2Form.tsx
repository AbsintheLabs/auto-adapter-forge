import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, Trash2 } from "lucide-react";
import { FieldWithInfo } from "./FieldWithInfo";

export const UniswapV2Form = () => {
  const form = useFormContext();
  const { fields: swapFields, append: appendSwap, remove: removeSwap } = useFieldArray({
    control: form.control,
    name: "swaps",
  });

  const { fields: lpFields, append: appendLp, remove: removeLp } = useFieldArray({
    control: form.control,
    name: "lps",
  });

  const addSwap = () => {
    appendSwap({
      poolAddress: "",
      swapLegAddress: "",
      pricingKind: "coingecko",
      coingeckoId: "",
    });
  };

  const addLp = () => {
    appendLp({
      poolAddress: "",
      token0PricingKind: "coingecko",
      token0CoingeckoId: "",
      token1PricingKind: "coingecko",
      token1CoingeckoId: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Swap Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Swap Entries</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSwap}>
            <Plus className="mr-2 h-4 w-4" />
            Add Swap
          </Button>
        </div>
        {swapFields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Swap Entry {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSwap(index)}
                  disabled={swapFields.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name={`swaps.${index}.poolAddress`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FieldWithInfo fieldName="poolAddress" label="Pool Address">
                      <FormControl>
                        <Input placeholder="0x0621bae969de9c153835680f158f481424c0720a" {...formField} />
                      </FormControl>
                    </FieldWithInfo>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`swaps.${index}.swapLegAddress`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FieldWithInfo fieldName="swapLegAddress" label="Swap Leg Address">
                      <FormControl>
                        <Input placeholder="0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28" {...formField} />
                      </FormControl>
                    </FieldWithInfo>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`swaps.${index}.pricingKind`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FieldWithInfo fieldName="pricingKind" label="Pricing Kind">
                      <Select onValueChange={formField.onChange} value={formField.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pricing kind" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pegged">Pegged</SelectItem>
                          <SelectItem value="coingecko">CoinGecko</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWithInfo>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch(`swaps.${index}.pricingKind`) === "pegged" && (
                <FormField
                  control={form.control}
                  name={`swaps.${index}.usdPegValue`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FieldWithInfo fieldName="usdPegValue" label="USD Peg Value">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="121613.2"
                            {...formField}
                            onChange={(e) => formField.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                      </FieldWithInfo>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch(`swaps.${index}.pricingKind`) === "coingecko" && (
                <FormField
                  control={form.control}
                  name={`swaps.${index}.coingeckoId`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FieldWithInfo fieldName="coingeckoId" label="CoinGecko ID">
                        <FormControl>
                          <Input placeholder="bitcoin" {...formField} />
                        </FormControl>
                      </FieldWithInfo>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LP Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">LP Entries</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLp}>
            <Plus className="mr-2 h-4 w-4" />
            Add LP
          </Button>
        </div>
        {lpFields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">LP Entry {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLp(index)}
                  disabled={lpFields.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name={`lps.${index}.poolAddress`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FieldWithInfo fieldName="poolAddress" label="Pool Address">
                      <FormControl>
                        <Input placeholder="0x0621bae969de9c153835680f158f481424c0720a" {...formField} />
                      </FormControl>
                    </FieldWithInfo>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Token 0 Pricing</h4>
                  <FormField
                    control={form.control}
                    name={`lps.${index}.token0PricingKind`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="token0PricingKind" label="Pricing Kind">
                          <Select onValueChange={formField.onChange} value={formField.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pricing kind" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pegged">Pegged</SelectItem>
                              <SelectItem value="coingecko">CoinGecko</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch(`lps.${index}.token0PricingKind`) === "pegged" && (
                    <FormField
                      control={form.control}
                      name={`lps.${index}.token0UsdPegValue`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FieldWithInfo fieldName="token0UsdPegValue" label="USD Peg Value">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="121613.2"
                                {...formField}
                                onChange={(e) => formField.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              />
                            </FormControl>
                          </FieldWithInfo>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {form.watch(`lps.${index}.token0PricingKind`) === "coingecko" && (
                    <FormField
                      control={form.control}
                      name={`lps.${index}.token0CoingeckoId`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FieldWithInfo fieldName="token0CoingeckoId" label="CoinGecko ID">
                            <FormControl>
                              <Input placeholder="bitcoin" {...formField} />
                            </FormControl>
                          </FieldWithInfo>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Token 1 Pricing</h4>
                  <FormField
                    control={form.control}
                    name={`lps.${index}.token1PricingKind`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="token1PricingKind" label="Pricing Kind">
                          <Select onValueChange={formField.onChange} value={formField.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pricing kind" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pegged">Pegged</SelectItem>
                              <SelectItem value="coingecko">CoinGecko</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch(`lps.${index}.token1PricingKind`) === "pegged" && (
                    <FormField
                      control={form.control}
                      name={`lps.${index}.token1UsdPegValue`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FieldWithInfo fieldName="token1UsdPegValue" label="USD Peg Value">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1.0"
                                {...formField}
                                onChange={(e) => formField.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              />
                            </FormControl>
                          </FieldWithInfo>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {form.watch(`lps.${index}.token1PricingKind`) === "coingecko" && (
                    <FormField
                      control={form.control}
                      name={`lps.${index}.token1CoingeckoId`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FieldWithInfo fieldName="token1CoingeckoId" label="CoinGecko ID">
                            <FormControl>
                              <Input placeholder="usd-coin" {...formField} />
                            </FormControl>
                          </FieldWithInfo>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

