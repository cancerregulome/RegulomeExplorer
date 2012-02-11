var out = "", indent=0;
function SvgToString(elem)
{
   if (elem)
   {
      var attrs = elem.attributes;
      var attr;
      var i;
      var childs = elem.childNodes;

      for (i=0; i<indent; i++) out += "  ";
      out += "<" + elem.nodeName;
      for (i=attrs.length-1; i>=0; i--)
      {
         attr = attrs.item(i);
         out += " " + attr.nodeName + "=\"" + attr.nodeValue+ "\"";
      }

      if (elem.hasChildNodes())
      {
         out += ">\n";
         indent++;
         for (i=0; i<childs.length; i++)
         {
            if (childs.item(i).nodeType == 1) // element node ..
               SvgToString(childs.item(i));
            else if (childs.item(i).nodeType == 3) // text node ..
            {
               for (j=0; j<indent; j++) out += "  ";
               out += childs.item(i).nodeValue + "\n";
            }
         }
         indent--;
         for (i=0; i<indent; i++) out += "  ";
         out += "</" + elem.nodeName + ">\n";
      }
      else
      {
         out += " />\n";
      }

   }
   return out;
}
