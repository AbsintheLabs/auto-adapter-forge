import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./ui/form";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CHAIN_OPTIONS, getGatewayUrlForChainId } from "@/lib/chainMapping";
import { FieldWithInfo } from "./FieldWithInfo";
import { UniswapV2Form } from "./UniswapV2Form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { FIELD_INFO } from "@/lib/fieldInfo";
import { UniswapV2HelpModal } from "./UniswapV2HelpModal";
import { ERC20HelpModal } from "./ERC20HelpModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface AdapterFormProps {
  adapterType: string;
  schema: z.ZodTypeAny;
  fields: readonly { 
    name: string; 
    label: string; 
    type: string; 
    placeholder?: string;
    options?: readonly (string | number)[] | string[];
  }[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const AdapterForm = ({ adapterType, schema, fields, onSubmit, isLoading }: AdapterFormProps) => {
  const isUniswapV2 = adapterType.toLowerCase().includes("uniswap");
  
  // Filter out sink-related fields that should never be shown in the UI
  // These are handled automatically in the backend
  const visibleFields = fields.filter(f => 
    f.name !== "csvPath" && 
    f.name !== "enableStdout" && 
    f.name !== "enableAbsinthe"
  );
  
  const defaultValues: any = {
    finality: 75,
    csvPath: isUniswapV2 ? "uniswap-v2.csv" : "positions.csv",
    enableStdout: !isUniswapV2,
    enableAbsinthe: true, // Always true for both ERC20 and Uniswap V2
    flushIntervalHours: isUniswapV2 ? 2 : 1,
    chainId: undefined,
    gatewayUrl: undefined,
  };

  if (!isUniswapV2) {
    defaultValues.pricingKind = "pegged";
  } else {
    defaultValues.swaps = [
      {
        poolAddress: "",
        swapLegAddress: "",
        pricingKind: "coingecko",
        coingeckoId: "",
      },
    ];
    defaultValues.lps = [
      {
        poolAddress: "",
        token0PricingKind: "coingecko",
        token0CoingeckoId: "",
        token1PricingKind: "coingecko",
        token1CoingeckoId: "",
      },
    ];
  }

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const pricingKind = form.watch("pricingKind");
  const chainId = form.watch("chainId");
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);

  // Automatically set gatewayUrl when chainId changes
  React.useEffect(() => {
    if (chainId) {
      const gatewayUrl = getGatewayUrlForChainId(chainId);
      if (gatewayUrl) {
        form.setValue("gatewayUrl", gatewayUrl);
      }
    }
  }, [chainId, form]);

  const handleSubmit = (data: any) => {
    console.log("Form submitted with data:", data);
    
    // Transform flushIntervalHours to flushInterval string
    if (data.flushIntervalHours !== undefined) {
      data.flushInterval = `${data.flushIntervalHours}h`;
      delete data.flushIntervalHours;
    }
    // Ensure gatewayUrl is set from chainId if not already set
    if (!data.gatewayUrl && data.chainId) {
      const gatewayUrl = getGatewayUrlForChainId(data.chainId);
      if (gatewayUrl) {
        data.gatewayUrl = gatewayUrl;
      }
    }
    console.log("Transformed data:", data);
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{adapterType} Configuration</CardTitle>
            <CardDescription>Fill in the required fields for your adapter</CardDescription>
          </div>
          {isUniswapV2 ? <UniswapV2HelpModal /> : <ERC20HelpModal />}
        </div>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(
                handleSubmit,
                (errors) => {
                  console.error("Form validation errors:", errors);
                }
              )} 
              className="space-y-6"
            >
            {/* Network Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Network Configuration</h3>
              
              {/* Chain Selection */}
              {visibleFields.filter(f => f.name === "chainId").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FieldWithInfo fieldName="chainId" label={field.label}>
                        <Select
                          onValueChange={(value) => {
                            const chainId = Number(value);
                            formField.onChange(chainId);
                            // Automatically set gatewayUrl
                            const gatewayUrl = getGatewayUrlForChainId(chainId);
                            if (gatewayUrl) {
                              form.setValue("gatewayUrl", gatewayUrl);
                            }
                          }}
                          value={formField.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a chain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CHAIN_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWithInfo>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

            </div>

            {/* Range Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Block Range</h3>
              {visibleFields.filter(f => f.name === "fromBlock").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FieldWithInfo fieldName={field.name} label={field.label}>
                        <FormControl>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...formField}
                            onChange={(e) => {
                              const value = field.type === "number" 
                                ? (e.target.value === "" ? undefined : Number(e.target.value))
                                : e.target.value;
                              formField.onChange(value);
                            }}
                          />
                        </FormControl>
                      </FieldWithInfo>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>


            {/* Advanced Options - Collapsible */}
            <div className="border-t pt-4">
              <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    <span className="font-semibold">Advanced Options</span>
                    {showAdvancedOptions ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                {/* Finality */}
                {visibleFields.filter(f => f.name === "finality").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="finality" label={field.label}>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              {...formField}
                              onChange={(e) => {
                                const value = field.type === "number" ? Number(e.target.value) : e.target.value;
                                formField.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {/* To Block */}
                {visibleFields.filter(f => f.name === "toBlock").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName={field.name} label={field.label}>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              {...formField}
                              onChange={(e) => {
                                const value = field.type === "number" 
                                  ? (e.target.value === "" ? undefined : Number(e.target.value))
                                  : e.target.value;
                                formField.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {/* Flush Interval */}
                {visibleFields.filter(f => f.name === "flushIntervalHours").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="flushIntervalHours" label={field.label}>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              {...formField}
                              onChange={(e) => {
                                const value = e.target.value === "" ? undefined : Number(e.target.value);
                                formField.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Adapter Configuration */}
            {!isUniswapV2 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Token Configuration</h3>
                
                {/* Token Contract Address */}
                {visibleFields.filter(f => f.name === "tokenContractAddress").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="tokenContractAddress" label={field.label}>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              {...formField}
                            />
                          </FormControl>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {/* Pricing Kind */}
                {visibleFields.filter(f => f.name === "pricingKind").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="pricingKind" label={field.label}>
                          <Select 
                            onValueChange={(value) => {
                              formField.onChange(value);
                              // Clear conditional fields when switching pricing kind
                              if (value === "pegged") {
                                form.setValue("coingeckoId", undefined);
                              } else {
                                form.setValue("usdPegValue", undefined);
                              }
                            }} 
                            defaultValue={formField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={field.placeholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {/* Conditional Pricing Fields */}
                {pricingKind === "pegged" && visibleFields.filter(f => f.name === "usdPegValue").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="usdPegValue" label={field.label}>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              {...formField}
                              onChange={(e) => {
                                const value = e.target.value === "" ? undefined : Number(e.target.value);
                                formField.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {pricingKind === "coingecko" && visibleFields.filter(f => f.name === "coingeckoId").map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FieldWithInfo fieldName="coingeckoId" label={field.label}>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              {...formField}
                            />
                          </FormControl>
                        </FieldWithInfo>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            ) : (
              <UniswapV2Form />
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Config"}
            </Button>
          </form>
        </Form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
