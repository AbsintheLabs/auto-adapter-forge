import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./ui/input";
import { FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { FieldWithInfo } from "./FieldWithInfo";

export const UniswapV3Form = () => {
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
                    placeholder="0x92787e904D925662272F3776b8a7f0b8F92F9BB5" 
                    {...formField}
                  />
                </FormControl>
              </FieldWithInfo>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <p className="text-sm text-muted-foreground">
          Enter the Uniswap V3 pool address. The system will automatically fetch token addresses and CoinGecko IDs, then generate complete swap entries for both tokens.
        </p>
      </div>
    </div>
  );
};

