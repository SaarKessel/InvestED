import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  LineChart,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  PenLine,
  Rocket,
  Code2,
  Bot,
} from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";


const FEATURES = [
  {
    icon: Brain,
    title: "׳ ׳™׳×׳•׳— ׳׳‘׳•׳¡׳¡ AI",
    desc:
      "׳×׳׳¨ ׳׳× ׳¢׳¦׳׳ ׳‘׳©׳₪׳” ׳—׳•׳₪׳©׳™׳×, ׳•׳”׳׳¢׳¨׳›׳× ׳×׳–׳”׳” ׳׳˜׳¨׳•׳×, ׳¨׳׳× ׳¡׳™׳›׳•׳ ׳•׳׳•׳₪׳§ ׳”׳©׳§׳¢׳”.",
  },
  {
    icon: ShieldCheck,
    title: "Explainable AI",
    desc:
      "׳›׳ ׳׳¡׳§׳ ׳” ׳׳’׳™׳¢׳” ׳¢׳ ׳”׳¡׳‘׳¨ ׳©׳§׳•׳£: ׳׳™׳׳• ׳ ׳×׳•׳ ׳™׳ ׳”׳•׳‘׳™׳׳• ׳׳×׳•׳¦׳׳” ׳•׳׳׳”.",
  },
  {
    icon: LineChart,
    title: "׳ ׳™׳×׳•׳— ׳×׳™׳§ ׳׳™׳׳•׳“׳™",
    desc:
      "׳§׳‘׳ ׳”׳“׳׳™׳™׳× ׳”׳§׳¦׳׳× ׳ ׳›׳¡׳™׳, ׳׳¡׳˜׳¨׳˜׳’׳™׳•׳× ׳•׳׳•׳©׳’׳™׳ ׳₪׳™׳ ׳ ׳¡׳™׳™׳ ׳‘׳¦׳•׳¨׳” ׳₪׳©׳•׳˜׳”.",
  },
  {
    icon: GraduationCap,
    title: "׳׳¡׳׳•׳ ׳׳׳™׳“׳” ׳׳™׳©׳™",
    desc:
      "Roadmap ׳׳•׳×׳׳ ׳׳™׳©׳™׳× ׳׳”׳‘׳¡׳™׳¡ ׳•׳¢׳“ ׳”׳‘׳ ׳” ׳׳×׳§׳“׳׳× ׳©׳ ׳¢׳•׳׳ ׳”׳”׳©׳§׳¢׳•׳×.",
  },
];


const AUDIENCE = [
  "׳׳×׳—׳™׳׳™׳ ׳׳’׳׳¨׳™ ׳‘׳¢׳•׳׳ ׳”׳”׳©׳§׳¢׳•׳×",
  "׳׳ ׳©׳™׳ ׳©׳¨׳•׳¦׳™׳ ׳׳”׳‘׳™׳ ׳׳₪׳ ׳™ ׳§׳‘׳׳× ׳”׳—׳׳˜׳•׳× ׳₪׳™׳ ׳ ׳¡׳™׳•׳×",
  "׳¡׳˜׳•׳“׳ ׳˜׳™׳ ׳׳›׳׳›׳׳”, ׳׳ ׳”׳ ׳¢׳¡׳§׳™׳ ׳•׳₪׳™׳ ׳ ׳¡׳™׳",
  "׳›׳ ׳׳™ ׳©׳¨׳•׳¦׳” ׳׳׳׳•׳“ ׳”׳©׳§׳¢׳•׳× ׳‘׳¦׳•׳¨׳” ׳‘׳¨׳•׳¨׳” ׳•׳₪׳©׳•׳˜׳”",
];


const STEPS = [
  {
    icon: PenLine,
    title: "׳׳×׳׳¨׳™׳ ׳׳× ׳¢׳¦׳׳›׳",
    desc:
      "׳›׳•׳×׳‘׳™׳ ׳‘׳©׳₪׳” ׳—׳•׳₪׳©׳™׳× ׳’׳™׳, ׳׳˜׳¨׳•׳×, ׳ ׳™׳¡׳™׳•׳, ׳¡׳›׳•׳ ׳”׳©׳§׳¢׳” ׳•׳¨׳׳× ׳¡׳™׳›׳•׳.",
  },
  {
    icon: Brain,
    title: "׳”ײ¾AI ׳׳ ׳×׳—",
    desc:
      "׳׳ ׳•׳¢ ׳ ׳™׳×׳•׳— ׳׳–׳”׳” ׳₪׳¨׳•׳₪׳™׳ ׳׳©׳§׳™׳¢, ׳׳•׳₪׳§ ׳”׳©׳§׳¢׳” ׳•׳”׳¢׳“׳₪׳•׳×.",
  },
  {
    icon: Sparkles,
    title: "׳׳§׳‘׳׳™׳ Dashboard ׳׳™׳©׳™",
    desc:
      "׳₪׳¨׳•׳₪׳™׳ ׳׳©׳§׳™׳¢, Explainable AI, ׳׳¡׳˜׳¨׳˜׳’׳™׳•׳× ׳•׳×׳•׳›׳ ׳׳™׳׳•׳“׳™.",
  },
];


const TECH_STACK = [
  {
    icon: Bot,
    title: "AI Engine",
    desc: "Rule Based Analysis + Ollama Local AI",
  },
  {
    icon: Code2,
    title: "Modern Stack",
    desc: "React + TypeScript + Vite",
  },
  {
    icon: Rocket,
    title: "FinTech Project",
    desc: "Educational investment intelligence platform",
  },
];



export function LandingPage() {
  return (
    <Layout>

      {/* HERO */}

      <section className="relative overflow-hidden bg-grid">

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />


        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">


          <motion.div
            initial={{
              opacity:0,
              y:10
            }}
            animate={{
              opacity:1,
              y:0
            }}
            transition={{
              duration:0.5
            }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft"
          >

            <Sparkles className="h-3.5 w-3.5 text-primary" />

            ׳₪׳׳˜׳₪׳•׳¨׳׳× FinTech ׳—׳™׳ ׳•׳›׳™׳× ׳׳‘׳•׳¡׳¡׳× AI

          </motion.div>



          <motion.h1
            initial={{
              opacity:0,
              y:16
            }}
            animate={{
              opacity:1,
              y:0
            }}
            transition={{
              duration:0.6
            }}
            className="max-w-3xl text-balance font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
          >

            ׳”׳›׳™׳¨׳• ׳׳× ׳¡׳’׳ ׳•׳ ׳”׳”׳©׳§׳¢׳” ׳©׳׳›׳

            <br />

            <span className="gradient-text">
              ׳‘׳¢׳–׳¨׳× AI
            </span>

          </motion.h1>



          <motion.p
            initial={{
              opacity:0,
              y:16
            }}
            animate={{
              opacity:1,
              y:0
            }}
            transition={{
              duration:0.6,
              delay:0.1
            }}
            className="mt-6 max-w-xl text-balance text-lg text-muted-foreground"
          >

            InvestED ׳”׳•׳₪׳›׳× ׳¢׳•׳׳ ׳׳•׳¨׳›׳‘ ׳©׳ ETF,
            ׳₪׳™׳–׳•׳¨, ׳¡׳™׳›׳•׳ ׳•׳”׳§׳¦׳׳× ׳ ׳›׳¡׳™׳ ׳׳—׳•׳•׳™׳™׳×
            ׳׳׳™׳“׳” ׳׳™׳©׳™׳×, ׳׳™׳ ׳˜׳¨׳׳§׳˜׳™׳‘׳™׳× ׳•׳‘׳¨׳•׳¨׳”.

            <br />

            <span className="text-sm">
              ׳׳¦׳•׳¨׳›׳™ ׳׳™׳׳•׳“ ׳‘׳׳‘׳“ ג€” ׳׳ ׳™׳™׳¢׳•׳¥ ׳”׳©׳§׳¢׳•׳×.
            </span>

          </motion.p>



          <motion.div
            initial={{
              opacity:0,
              y:16
            }}
            animate={{
              opacity:1,
              y:0
            }}
            transition={{
              duration:0.6,
              delay:0.15
            }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >

            <Link to="/start">

              <Button
                size="lg"
                className="gap-2"
              >

                ׳’׳׳• ׳׳× ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳›׳

                <ArrowLeft className="h-4 w-4"/>

              </Button>

            </Link>



            <Link to="/about">

              <Button
                size="lg"
                variant="outline"
              >

                ׳¢׳ ׳”׳₪׳¨׳•׳™׳§׳˜

              </Button>

            </Link>


          </motion.div>


        </div>

      </section>



      {/* FEATURES */}


      <section className="border-t border-border/60 py-24">

        <div className="container">


          <div className="mb-14 text-center">

            <h2 className="font-display text-3xl font-bold md:text-4xl">
              ׳׳” ׳–׳” InvestED?
            </h2>


            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">

              ׳©׳™׳׳•׳‘ ׳©׳ AI, ׳₪׳™׳ ׳ ׳¡׳™׳ ׳•׳¢׳™׳¦׳•׳‘ ׳—׳•׳•׳™׳™׳× ׳׳©׳×׳׳©
              ׳›׳“׳™ ׳׳”׳₪׳•׳ ׳”׳©׳§׳¢׳•׳× ׳׳׳•׳‘׳ ׳•׳× ׳™׳•׳×׳¨.

            </p>


          </div>



          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">


            {FEATURES.map((feature,index)=>(


              <motion.div

                key={feature.title}

                initial={{
                  opacity:0,
                  y:20
                }}

                whileInView={{
                  opacity:1,
                  y:0
                }}

                viewport={{
                  once:true
                }}

                transition={{
                  delay:index*0.08
                }}

              >


                <Card className="h-full p-1">


                  <CardContent className="pt-5">


                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">


                      <feature.icon className="h-5 w-5"/>


                    </div>


                    <h3 className="mb-2 font-display font-bold">

                      {feature.title}

                    </h3>


                    <p className="text-sm leading-relaxed text-muted-foreground">

                      {feature.desc}

                    </p>


                  </CardContent>


                </Card>


              </motion.div>


            ))}


          </div>


        </div>


      </section>

      {/* HOW IT WORKS */}

      <section className="border-t border-border/60 bg-muted/30 py-24">

        <div className="container">


          <div className="mb-14 text-center">

            <h2 className="font-display text-3xl font-bold md:text-4xl">

              ׳׳™׳ ׳–׳” ׳¢׳•׳‘׳“?

            </h2>


            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">

              ׳©׳׳•׳©׳” ׳©׳׳‘׳™׳ ׳₪׳©׳•׳˜׳™׳ ׳•׳§׳‘׳׳× ׳“׳©׳‘׳•׳¨׳“ ׳׳™׳׳•׳“׳™ ׳׳™׳©׳™.

            </p>


          </div>



          <div className="grid gap-6 md:grid-cols-3">


            {STEPS.map((step,index)=>(


              <motion.div

                key={step.title}

                initial={{
                  opacity:0,
                  y:20
                }}

                whileInView={{
                  opacity:1,
                  y:0
                }}

                viewport={{
                  once:true
                }}

                transition={{
                  delay:index*0.1
                }}

                className="rounded-2xl border border-border bg-card p-7 shadow-soft"

              >


                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-lg font-bold text-white">

                  {index + 1}

                </div>



                <h3 className="mb-2 font-display text-lg font-bold">

                  {step.title}

                </h3>



                <p className="text-sm leading-relaxed text-muted-foreground">

                  {step.desc}

                </p>


              </motion.div>


            ))}


          </div>


        </div>


      </section>





      {/* WHO IS IT FOR */}


      <section className="border-t border-border/60 py-24">


        <div className="container grid items-center gap-12 md:grid-cols-2">


          <div>


            <h2 className="font-display text-3xl font-bold md:text-4xl">

              ׳׳׳™ ׳–׳” ׳׳×׳׳™׳?

            </h2>



            <p className="mt-4 text-muted-foreground">

              InvestED ׳ ׳‘׳ ׳×׳” ׳¢׳‘׳•׳¨ ׳׳ ׳©׳™׳ ׳©׳¨׳•׳¦׳™׳ ׳׳”׳‘׳™׳
              ׳׳× ׳¢׳•׳׳ ׳”׳”׳©׳§׳¢׳•׳× ׳׳₪׳ ׳™ ׳©׳”׳ ׳׳§׳‘׳׳™׳ ׳”׳—׳׳˜׳•׳×.

            </p>



            <ul className="mt-7 space-y-3">


              {AUDIENCE.map(item=>(


                <li

                  key={item}

                  className="flex items-start gap-3 text-sm"

                >

                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"/>

                  {item}


                </li>


              ))}


            </ul>



            <Link
              to="/start"
              className="mt-8 inline-block"
            >

              <Button
                size="lg"
                className="gap-2"
              >

                ׳”׳×׳—׳™׳׳• ׳¢׳›׳©׳™׳•

                <ArrowLeft className="h-4 w-4"/>

              </Button>


            </Link>


          </div>





          <div className="relative">


            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent blur-2xl"/>



            <Card className="p-2">


              <CardContent className="space-y-5 pt-6">


                <div className="flex items-center justify-between">


                  <span className="text-sm font-semibold text-muted-foreground">

                    ׳“׳•׳’׳׳” ׳׳₪׳¨׳•׳₪׳™׳ ׳׳©׳§׳™׳¢

                  </span>



                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">

                    8/10 ׳¡׳™׳›׳•׳

                  </span>


                </div>



                <div className="h-2 overflow-hidden rounded-full bg-muted">

                  <div className="h-full w-4/5 rounded-full gradient-brand"/>

                </div>




                <div className="grid grid-cols-3 gap-3">


                  {[
                    {
                      label:"׳׳ ׳™׳•׳× ׳׳¨׳”׳´׳‘",
                      value:"50%"
                    },
                    {
                      label:"׳‘׳™׳ ׳׳׳•׳׳™",
                      value:"20%"
                    },
                    {
                      label:"׳˜׳›׳ ׳•׳׳•׳’׳™׳”",
                      value:"15%"
                    },

                  ].map(item=>(


                    <div

                      key={item.label}

                      className="rounded-xl border border-border p-3 text-center"

                    >

                      <div className="text-xs text-muted-foreground">

                        {item.label}

                      </div>


                      <div className="mt-1 font-display font-bold">

                        {item.value}

                      </div>


                    </div>


                  ))}


                </div>


              </CardContent>


            </Card>


          </div>


        </div>


      </section>





      {/* TECH STACK */}


      <section className="border-t border-border/60 bg-muted/30 py-20">


        <div className="container">


          <div className="mb-10 text-center">


            <h2 className="font-display text-3xl font-bold">

              ׳‘׳ ׳•׳™ ׳‘׳˜׳›׳ ׳•׳׳•׳’׳™׳•׳× ׳׳•׳“׳¨׳ ׳™׳•׳×

            </h2>


            <p className="mt-3 text-muted-foreground">

              ׳₪׳¨׳•׳™׳§׳˜ FinTech ׳׳™׳©׳™ ׳”׳׳©׳׳‘ ׳₪׳™׳×׳•׳— ׳×׳•׳›׳ ׳”,
              AI ׳•׳—׳™׳ ׳•׳ ׳₪׳™׳ ׳ ׳¡׳™.

            </p>


          </div>




          <div className="grid gap-5 md:grid-cols-3">


            {TECH_STACK.map(item=>(


              <Card key={item.title}>


                <CardContent className="pt-6">


                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">


                    <item.icon className="h-5 w-5"/>


                  </div>



                  <h3 className="font-bold">

                    {item.title}

                  </h3>



                  <p className="mt-2 text-sm text-muted-foreground">

                    {item.desc}

                  </p>


                </CardContent>


              </Card>


            ))}


          </div>


        </div>


      </section>






      {/* FINAL CTA */}



      <section className="border-t border-border/60 py-24">


        <div className="container text-center">


          <Card className="mx-auto max-w-3xl overflow-hidden">


            <CardContent className="p-10">


              <Sparkles className="mx-auto mb-5 h-10 w-10 text-primary"/>



              <h2 className="font-display text-3xl font-bold">


                ׳׳•׳›׳ ׳™׳ ׳׳”׳›׳™׳¨ ׳׳× ׳₪׳¨׳•׳₪׳™׳ ׳”׳”׳©׳§׳¢׳” ׳©׳׳›׳?


              </h2>



              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">


                ׳›׳×׳‘׳• ׳›׳׳” ׳׳©׳₪׳˜׳™׳ ׳¢׳ ׳¢׳¦׳׳›׳ ׳•׳§׳‘׳׳•
                ׳ ׳™׳×׳•׳— ׳׳™׳׳•׳“׳™ ׳׳‘׳•׳¡׳¡ AI ׳‘׳×׳•׳ ׳₪׳—׳•׳× ׳׳“׳§׳”.


              </p>




              <Link
                to="/start"
                className="mt-8 inline-block"
              >


                <Button
                  size="lg"
                  className="gap-2"
                >


                  ׳”׳×׳—׳™׳׳• ׳ ׳™׳×׳•׳— AI


                  <ArrowLeft className="h-4 w-4"/>


                </Button>


              </Link>



            </CardContent>


          </Card>


        </div>


      </section>


    </Layout>

  );

}

