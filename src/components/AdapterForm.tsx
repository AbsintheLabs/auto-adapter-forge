import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

interface AdapterFormProps {
  adapterType: string;
  schema: z.ZodObject<any>;
  fields: readonly { name: string; label: string; type: string; placeholder: string }[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const AdapterForm = ({ adapterType, schema, fields, onSubmit, isLoading }: AdapterFormProps) => {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  const handleSubmit = (data: any) => {
    // Convert pricing string to array
    if (data.pricing && typeof data.pricing === "string") {
      data.pricing = data.pricing.split(",").map((s: string) => s.trim());
    }
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {fields.map((field) => (
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Config"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
