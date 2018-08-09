<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl"
    xmlns:wix="http://schemas.microsoft.com/wix/2006/wi">
  <xsl:output method="xml" indent="yes"/>
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match='/wix:Wix/wix:Fragment/wix:ComponentGroup/wix:Component/wix:File'>
    <xsl:copy>
      <xsl:apply-templates select="@*"/>
      <xsl:attribute name="KeyPath">
        <xsl:text>no</xsl:text>
      </xsl:attribute>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="/wix:Wix/wix:Fragment/wix:ComponentGroup">
    <xsl:copy>
      <xsl:apply-templates select="@*"/>

      <xsl:element name="Component" namespace="http://schemas.microsoft.com/wix/2006/wi">
        <xsl:attribute name="Id">
          <xsl:text>*</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Directory">
          <xsl:text>INSTALLFOLDER</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Guid">
          <xsl:text>*</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="KeyPath">
          <xsl:text>no</xsl:text>
        </xsl:attribute>

        <xsl:element name="RegistryValue" namespace="http://schemas.microsoft.com/wix/2006/wi">
          <xsl:attribute name="Type">
            <xsl:text>integer</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Root">
            <xsl:text>HKCU</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Key">
            <xsl:text>Software\Microsoft\sfxstandalone</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Name">
            <xsl:text>installed</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Value">
            <xsl:number value="1" />
          </xsl:attribute>
          <xsl:attribute name="KeyPath">
            <xsl:text>yes</xsl:text>
          </xsl:attribute>
        </xsl:element>

        <xsl:element name="RemoveRegistryKey" namespace="http://schemas.microsoft.com/wix/2006/wi">
          <xsl:attribute name="Action">
            <xsl:text>removeOnUninstall</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Root">
            <xsl:text>HKCU</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Key">
            <xsl:text>Software\Microsoft\sfxstandalone</xsl:text>
          </xsl:attribute>
        </xsl:element>

        <xsl:element name="RemoveFolder" namespace="http://schemas.microsoft.com/wix/2006/wi">
          <xsl:attribute name="Id">
            <xsl:text>*</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Directory">
            <xsl:text>INSTALLFOLDER</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="On">
            <xsl:text>uninstall</xsl:text>
          </xsl:attribute>
        </xsl:element>

        <xsl:element name="RemoveFolder" namespace="http://schemas.microsoft.com/wix/2006/wi">
          <xsl:attribute name="Id">
            <xsl:text>*</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="Directory">
            <xsl:text>CompanyFolder</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="On">
            <xsl:text>uninstall</xsl:text>
          </xsl:attribute>
        </xsl:element>

        <xsl:for-each select="/wix:Wix/wix:Fragment/wix:DirectoryRef/wix:Directory">
          <xsl:element name="RemoveFolder" namespace="http://schemas.microsoft.com/wix/2006/wi">
            <xsl:attribute name="Id">
              <xsl:text>*</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="Directory">
              <xsl:value-of select="./@Id" />
            </xsl:attribute>
            <xsl:attribute name="On">
              <xsl:text>uninstall</xsl:text>
            </xsl:attribute>
          </xsl:element>
        </xsl:for-each>

      </xsl:element>

      <xsl:apply-templates select="node()" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="/wix:Wix/wix:Fragment/wix:ComponentGroup/wix:Component">
    <xsl:copy>
      <xsl:apply-templates select="@*"/>
      <xsl:attribute name="KeyPath">
        <xsl:text>no</xsl:text>
      </xsl:attribute>

      <xsl:apply-templates select="node()" />

      <xsl:element name="RegistryValue" namespace="http://schemas.microsoft.com/wix/2006/wi">
        <xsl:attribute name="Type">
          <xsl:text>integer</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Root">
          <xsl:text>HKCU</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Key">
          <xsl:text>Software\Microsoft\sfxstandalone</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Name">
          <xsl:value-of select='substring-after(./wix:File/@Source, "SourceDir\")' />
        </xsl:attribute>
        <xsl:attribute name="Value">
          <xsl:number value="1" />
        </xsl:attribute>
        <xsl:attribute name="KeyPath">
          <xsl:text>yes</xsl:text>
        </xsl:attribute>
      </xsl:element>
      
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>