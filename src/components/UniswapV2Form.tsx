"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./ui/input";
import { FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { FieldWithInfo } from "./FieldWithInfo";

export const UniswapV2Form = () => {
  const form = useFormContext();

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pool Configuration</h3>
        
        <FormField
          control={form.control}
          name="poolAddress"
          render={({ field: formField }) => (
            <FormItem>
              <FieldWithInfo fieldName="poolAddress" label="Pool Address">
                <FormControl>
                  <Input 
                    placeholder="0x0621bae969de9c153835680f158f481424c0720a" 
                    {...formField}
                  />
                </FormControl>
              </FieldWithInfo>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <p className="text-sm text-muted-foreground">
          Enter the Uniswap V2 pool address. The system will automatically fetch token addresses and CoinGecko IDs, then generate complete swap and LP entries.
        </p>
      </div>
    </div>
  );
};
