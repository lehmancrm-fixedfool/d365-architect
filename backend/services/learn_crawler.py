"""
Microsoft Learn Documentation Crawler

Crawls and indexes official Microsoft Learn documentation for:
- Agent Builder and Copilot Studio patterns
- D365 AI and Copilot capabilities
- Power Platform architecture
- Multi-agent solution design
- Responsible AI practices
"""

import os
import json
import time
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
import logging

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LearnDocCrawler:
    """Crawls Microsoft Learn documentation and converts to structured markdown."""
    
    BASE_URL = "https://learn.microsoft.com"
    
    # Priority Learn paths for D365 Architect Agent
    LEARN_PATHS = [
        # Agent Builder & Copilot Studio
        "/en-us/microsoft-365/copilot/extensibility/agent-builder",
        "/en-us/microsoft-365/copilot/extensibility/agent-builder-build-agents",
        "/en-us/microsoft-365/copilot/extensibility/copilot-studio-experience",
        "/en-us/microsoft-copilot-studio/",
        "/en-us/microsoft-copilot-studio/guidance/architecture-overview",
        "/en-us/microsoft-copilot-studio/whats-new",
        "/en-us/microsoft-agent-365/builder/overview",
        
        # D365 Copilot and AI
        "/en-us/dynamics365/copilot/ai-get-started",
        "/en-us/dynamics365/guidance/resources/field-service-deploy-copilot-studio-create-sample-data",
        "/en-us/dynamics365/business-applications-platform/",
        
        # Power Platform & Integration
        "/en-us/learn/paths/extend-dynamics-365-power-platform/",
        
        # Agentic AI Competency
        "/en-us/credentials/certifications/agentic-ai-business-solutions-architect/",
    ]
    
    def __init__(self, output_dir: str = "knowledge/learn_docs"):
        """
        Initialize crawler.
        
        Args:
            output_dir: Directory to save indexed markdown files
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'D365-Architect-Agent/1.0 (+https://github.com/lehmancrm-fixedfool/d365-architect)'
        })
        
        self.metadata_index = []
    
    def crawl_all(self) -> Dict[str, Any]:
        """
        Crawl all priority Learn paths.
        
        Returns:
            Summary of crawl results
        """
        logger.info(f"Starting Learn docs crawl for {len(self.LEARN_PATHS)} paths")
        
        results = {
            "crawl_timestamp": datetime.utcnow().isoformat(),
            "total_paths": len(self.LEARN_PATHS),
            "successful": 0,
            "failed": 0,
            "pages": []
        }
        
        for learn_path in self.LEARN_PATHS:
            try:
                logger.info(f"Crawling: {learn_path}")
                page_data = self.crawl_page(learn_path)
                
                if page_data:
                    results["successful"] += 1
                    results["pages"].append(page_data)
                    self.metadata_index.append(page_data["metadata"])
                else:
                    results["failed"] += 1
                    
            except Exception as e:
                logger.error(f"Error crawling {learn_path}: {str(e)}")
                results["failed"] += 1
            
            # Rate limiting
            time.sleep(1)
        
        # Save metadata index
        self._save_metadata_index()
        
        logger.info(f"Crawl complete: {results['successful']} successful, {results['failed']} failed")
        return results
    
    def crawl_page(self, learn_path: str) -> Optional[Dict[str, Any]]:
        """
        Crawl a single Learn documentation page.
        
        Args:
            learn_path: Path to Learn page (e.g., /en-us/microsoft-365/copilot/...)
            
        Returns:
            Page data with metadata and markdown content
        """
        url = urljoin(self.BASE_URL, learn_path)
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {str(e)}")
            return None
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract metadata
        title = self._extract_title(soup)
        description = self._extract_meta_description(soup)
        last_updated = self._extract_last_updated(soup)
        
        # Extract content
        main_content = soup.find('main') or soup.find('article')
        if not main_content:
            logger.warning(f"Could not find main content in {url}")
            return None
        
        markdown_content = self._convert_to_markdown(main_content)
        
        # Parse sections for chunking
        sections = self._extract_sections(main_content)
        
        # Create metadata
        metadata = {
            "source_title": title,
            "source_url": url,
            "source_path": learn_path,
            "source_type": "microsoft_learn",
            "description": description,
            "last_updated": last_updated,
            "crawl_timestamp": datetime.utcnow().isoformat(),
            "ingestion_priority": "P0",
            "business_domain": self._infer_domain(learn_path),
            "technology_domain": self._infer_tech_domain(learn_path),
            "section_count": len(sections),
            "content_length": len(markdown_content),
        }
        
        # Save to disk
        filename = self._get_safe_filename(title)
        filepath = self.output_dir / f"{filename}.md"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        logger.info(f"Saved: {filepath}")
        
        return {
            "metadata": metadata,
            "sections": sections,
            "filepath": str(filepath),
            "markdown_length": len(markdown_content),
        }
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title."""
        # Try h1 first
        h1 = soup.find('h1')
        if h1:
            return h1.get_text(strip=True)
        
        # Try meta title
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text(strip=True)
        
        return "Untitled"
    
    def _extract_meta_description(self, soup: BeautifulSoup) -> str:
        """Extract meta description."""
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            return meta['content']
        return ""
    
    def _extract_last_updated(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract last updated date."""
        # Look for common date patterns
        time_tag = soup.find('time')
        if time_tag and time_tag.get('datetime'):
            return time_tag['datetime']
        
        # Search for text like "Last updated"
        for text in soup.find_all(string=True):
            if 'last updated' in text.lower():
                return text.strip()
        
        return None
    
    def _convert_to_markdown(self, element) -> str:
        """
        Convert HTML content to markdown.
        
        This is a simplified converter. For production, consider html2text library.
        """
        md_lines = []
        
        for elem in element.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'code', 'blockquote']):
            if elem.name.startswith('h'):
                level = int(elem.name[1])
                md_lines.append(f"{'#' * level} {elem.get_text(strip=True)}\n")
            
            elif elem.name == 'p':
                text = elem.get_text(strip=True)
                if text:
                    md_lines.append(f"{text}\n")
            
            elif elem.name == 'li':
                text = elem.get_text(strip=True)
                md_lines.append(f"- {text}\n")
            
            elif elem.name == 'blockquote':
                text = elem.get_text(strip=True)
                md_lines.append(f"> {text}\n")
            
            elif elem.name == 'code':
                text = elem.get_text(strip=True)
                md_lines.append(f"`{text}`\n")
        
        return "".join(md_lines)
    
    def _extract_sections(self, element) -> List[Dict[str, str]]:
        """Extract main sections and headings."""
        sections = []
        current_section = None
        
        for elem in element.find_all(['h2', 'h3', 'p']):
            if elem.name in ['h2', 'h3']:
                if current_section:
                    sections.append(current_section)
                
                current_section = {
                    "title": elem.get_text(strip=True),
                    "level": elem.name,
                    "content": ""
                }
            
            elif elem.name == 'p' and current_section:
                current_section["content"] += elem.get_text(strip=True) + " "
        
        if current_section:
            sections.append(current_section)
        
        return sections
    
    def _infer_domain(self, learn_path: str) -> List[str]:
        """Infer business domain from learn path."""
        domains = []
        
        if 'agent' in learn_path.lower():
            domains.append('agents')
        if 'copilot' in learn_path.lower():
            domains.append('copilot')
        if 'dynamics365' in learn_path.lower():
            domains.append('dynamics_365')
        if 'power' in learn_path.lower():
            domains.append('power_platform')
        if 'field-service' in learn_path.lower():
            domains.append('field_service')
        
        return domains if domains else ['general']
    
    def _infer_tech_domain(self, learn_path: str) -> List[str]:
        """Infer technology domain from learn path."""
        tech = []
        
        if 'agent-builder' in learn_path:
            tech.append('agent_builder')
        if 'copilot-studio' in learn_path:
            tech.append('copilot_studio')
        if 'power-platform' in learn_path:
            tech.append('power_platform')
        if 'dataverse' in learn_path:
            tech.append('dataverse')
        if 'power-automate' in learn_path:
            tech.append('power_automate')
        
        return tech if tech else ['general']
    
    def _get_safe_filename(self, title: str) -> str:
        """Convert title to safe filename."""
        import re
        safe = re.sub(r'[^\w\s-]', '', title)
        safe = re.sub(r'[-\s]+', '-', safe)
        return safe.lower()
    
    def _save_metadata_index(self):
        """Save metadata index for retrieval."""
        index_path = self.output_dir / "metadata_index.json"
        
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata_index, f, indent=2)
        
        logger.info(f"Saved metadata index: {index_path}")


class LearnDocSearcher:
    """Search and retrieve indexed Learn documents."""
    
    def __init__(self, index_dir: str = "knowledge/learn_docs"):
        self.index_dir = Path(index_dir)
        self.metadata_index = self._load_metadata_index()
    
    def _load_metadata_index(self) -> List[Dict[str, Any]]:
        """Load metadata index."""
        index_path = self.index_dir / "metadata_index.json"
        
        if not index_path.exists():
            return []
        
        with open(index_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def search_by_domain(self, business_domain: str) -> List[Dict[str, Any]]:
        """Search docs by business domain."""
        results = []
        
        for doc in self.metadata_index:
            if business_domain in doc.get("business_domain", []):
                results.append(doc)
        
        return results
    
    def search_by_tech(self, tech_domain: str) -> List[Dict[str, Any]]:
        """Search docs by technology domain."""
        results = []
        
        for doc in self.metadata_index:
            if tech_domain in doc.get("technology_domain", []):
                results.append(doc)
        
        return results
    
    def get_all_docs(self) -> List[Dict[str, Any]]:
        """Get all indexed documents."""
        return self.metadata_index


if __name__ == "__main__":
    # Example usage
    crawler = LearnDocCrawler(output_dir="backend/knowledge/learn_docs")
    results = crawler.crawl_all()
    
    print(json.dumps(results, indent=2))
