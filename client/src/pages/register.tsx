import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@shared/schema";
import { apiRequest } from "@lib/auth";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "../hooks/use-toast";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      // Submit to /api/auth/register; apiRequest already parses JSON
      const result = await apiRequest(
        "/api/auth/register",
        "POST",
        {
          name: data.name,
          email: data.email,
          password: data.password,
          termsAccepted: data.termsAccepted,
        }
      );

      // If registration successful, token will be returned
      if ((result as any).token) {
        // Store token in localStorage and redirect to dashboard
        localStorage.setItem("thronixpro_token", (result as any).token);
        navigate("/dashboard");
      } else {
        // If no token returned, attempt to log in with new credentials
        const loginResp = await apiRequest(
          "/api/auth/login",
          "POST",
          {
            email: data.email,
            password: data.password,
          }
        );
        if ((loginResp as any).token) {
          localStorage.setItem("thronixpro_token", (loginResp as any).token);
          navigate("/dashboard");
        } else {
          toast({ title: "Registration failed", description: JSON.stringify(loginResp) });
        }
      }
    } catch (error: any) {
      toast({ title: "Registration error", description: error?.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 via-pink-600 to-red-500 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center">Create Account</h1>
        <p className="text-gray-600 mb-6 text-center">
          Join ThronixPRO to start trading with real funds
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Your name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={watch("termsAccepted")}
              onCheckedChange={(val) => setValue("termsAccepted", !!val)}
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I accept the legal disclaimer
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
