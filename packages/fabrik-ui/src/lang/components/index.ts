// Re-export all Fabrik Lang component definitions

export { StackDef, CardDef, CardHeaderDef } from "./layout"
export { TextContentDef, CodeBlockDef, CalloutDef, SeparatorDef, BadgeDef, ImageDef } from "./content"
export { TabsDef, TabItemDef, AccordionDef, AccordionItemDef } from "./navigation"
export { BarChartDef, LineChartDef, PieChartDef, SeriesDef, SliceDef } from "./charts"
export { TableDef, ColDef, ButtonDef } from "./data"

import { StackDef, CardDef, CardHeaderDef } from "./layout"
import { TextContentDef, CodeBlockDef, CalloutDef, SeparatorDef, BadgeDef, ImageDef } from "./content"
import { TabsDef, TabItemDef, AccordionDef, AccordionItemDef } from "./navigation"
import { BarChartDef, LineChartDef, PieChartDef, SeriesDef, SliceDef } from "./charts"
import { TableDef, ColDef, ButtonDef } from "./data"

/** All built-in Fabrik Lang components */
export const allLangComponents = [
  // Layout
  StackDef,
  CardDef,
  CardHeaderDef,
  // Content
  TextContentDef,
  CodeBlockDef,
  CalloutDef,
  SeparatorDef,
  BadgeDef,
  ImageDef,
  // Navigation
  TabsDef,
  TabItemDef,
  AccordionDef,
  AccordionItemDef,
  // Charts
  BarChartDef,
  LineChartDef,
  PieChartDef,
  SeriesDef,
  SliceDef,
  // Data
  TableDef,
  ColDef,
  ButtonDef,
]
