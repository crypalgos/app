"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spotlight } from "@/components/ui/spotlight-new";
import {
  Send,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Users,
  Mail,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactFeatures = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Quick Response",
      description: "We respond within 24 hours",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & Private",
      description: "Your information is protected",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Expert Team",
      description: "Get help from our specialists",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-20">
        <Spotlight
          gradientFirst="radial-gradient(circle at 40% 60%, var(--color-primary-transparent) 0%, var(--color-primary-transparent-dark) 40%, transparent 70%)"
          gradientSecond="radial-gradient(circle at 60% 40%, var(--color-accent-transparent) 0%, var(--color-accent-transparent-dark) 50%, transparent 80%)"
          gradientThird="radial-gradient(circle at 80% 20%, var(--color-primary-transparent-light) 0%, var(--color-primary-transparent-dim) 60%, transparent 90%)"
          duration={15}
          xOffset={100}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 px-4 py-2"
            >
              Get in Touch
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-6 text-foreground leading-[0.9]"
          >
            We'd Love to
            <br />
            <span className="text-primary italic">Hear From You</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12"
          >
            Have questions about our platform? Need help getting started? Or
            want to discuss partnership opportunities? Our team is here to help
            you succeed in your crypto trading journey.
          </motion.p>

          {/* Contact Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {contactFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3 text-center justify-center"
              >
                <div className="text-primary">{feature.icon}</div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {feature.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form Header */}
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter mb-4 text-foreground">
              Contact <span className="text-primary">Our Team</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium opacity-80 leading-relaxed">
              Send us a message using the form below and we'll get back to you
              soon.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Form Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2 space-y-6"
            >
              <div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter mb-4 text-foreground">
                  Let's Start <span className="text-primary">Conversation</span>
                </h3>
                <p className="text-muted-foreground mb-6">
                  Whether you're curious about features, need technical support,
                  or want to explore partnership opportunities, we're here to
                  answer any questions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground text-sm mb-1">
                      Direct Email
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <a
                        href="mailto:support@crypalogs.com"
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        support@crypalogs.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground text-sm mb-1">
                      Response Time
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Within 24 hours
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground text-sm mb-1">
                      Support Team
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expert developers & traders
                    </div>
                  </div>
                </div>
              </div>

              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <div className="font-medium text-primary text-sm mb-1">
                      Privacy First
                    </div>
                    <div className="text-xs text-primary/80">
                      Your information is secure and will never be shared with
                      third parties.
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-3"
            >
              <Card className="p-8 bg-card border-border backdrop-blur-3xl shadow-2xl rounded-[2rem]">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Send Us a Message
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Fill out the form below and we'll get back to you within 24
                    hours.
                  </p>
                </div>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll get back to you within
                      24 hours.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsSubmitted(false)}
                      className="min-w-[150px]"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="How can we help you?"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us more about your inquiry... (e.g., technical questions, feature requests, partnership opportunities)"
                        required
                        rows={5}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-medium transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our terms of service
                      and privacy policy.
                    </p>
                  </form>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
