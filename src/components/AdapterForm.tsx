import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./ui/form";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CHAIN_OPTIONS, getGatewayUrlForChainId } from "@/lib/chainMapping";

interface AdapterFormProps {
  adapterType: string;
  schema: z.ZodObject<any>;
  fields: readonly { 
    name: string; 
    label: string; 
    type: string; 
    placeholder?: string;
    options?: string[];
  }[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const AdapterForm = ({ adapterType, schema, fields, onSubmit, isLoading }: AdapterFormProps) => {
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      finality: 75,
      csvPath: "positions.csv",
      enableStdout: true,
      enableAbsinthe: true,
      flushIntervalHours: 1,
      pricingKind: "pegged" as const,
      chainId: undefined,
      gatewayUrl: undefined,
    },
  });

  const pricingKind = form.watch("pricingKind");
  const chainId = form.watch("chainId");

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
        <CardTitle>{adapterType} Configuration</CardTitle>
        <CardDescription>Fill in the required fields for your adapter</CardDescription>
      </CardHeader>
      <CardContent>
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
              {fields.filter(f => f.name === "chainId").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Finality */}
              {fields.filter(f => f.name === "finality").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Range Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Block Range</h3>
              {fields.filter(f => ["fromBlock", "toBlock"].includes(f.name)).map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Sink Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Output Sinks</h3>
              {fields.filter(f => ["csvPath", "enableStdout", "enableAbsinthe"].includes(f.name)).map((field) => {
                if (field.type === "checkbox") {
                  return (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name}
                      render={({ field: formField }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={formField.value}
                              onCheckedChange={formField.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{field.label}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  );
                }
                return (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...formField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>

            {/* General Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">General Configuration</h3>
              {fields.filter(f => f.name === "flushIntervalHours").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Adapter Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Token Configuration</h3>
              
              {/* Token Contract Address */}
              {fields.filter(f => f.name === "tokenContractAddress").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          {...formField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Pricing Kind */}
              {fields.filter(f => f.name === "pricingKind").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Conditional Pricing Fields */}
              {pricingKind === "pegged" && fields.filter(f => f.name === "usdPegValue").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {pricingKind === "coingecko" && fields.filter(f => f.name === "coingeckoId").map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          {...formField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Config"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
