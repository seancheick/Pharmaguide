import { callEdgeFunction } from "../services/supabase/client";

async function testEdgeFunction() {
  try {
    console.log("Testing Edge Function...");
    const result = await callEdgeFunction("ai-analysis", {
      action: "analyze-product",
      data: {
        product: {
          name: "Test Product",
          ingredients: ["Vitamin C", "Zinc"],
        },
        stack: [],
      },
    });
    console.log("Edge Function result:", result);
  } catch (error) {
    console.error("Edge Function error:", error);
  }
}

testEdgeFunction();
