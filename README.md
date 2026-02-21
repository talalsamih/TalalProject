# Affiliate Store Farm - Automated 1000 Store Deployment

Fully automated system to deploy and manage 1000 niche affiliate stores across 10 Hetzner servers. Each store contains thousands of products sourced from affiliate networks.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Control Server                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Terraform │ │ Ansible  │ │ Store CLI│ │ Product   │  │
│  │(Infra)   │ │(Config)  │ │(Deploy)  │ │ Importer  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Server 1  │  │Server 2  │  │  ...×10  │
│100 stores│  │100 stores│  │100 stores│
│Nginx+App │  │Nginx+App │  │Nginx+App │
│PostgreSQL│  │PostgreSQL│  │PostgreSQL│
└──────────┘  └──────────┘  └──────────┘
```

## Tech Stack

- **Infrastructure**: Terraform (Hetzner Cloud) + Ansible
- **Application**: Next.js (SSR for SEO) + PostgreSQL
- **Web Server**: Nginx (reverse proxy, SSL termination)
- **SSL**: Let's Encrypt (auto-renewal via Certbot)
- **Product Data**: Amazon PA-API, ShareASale, CJ Affiliate, Rakuten
- **Deployment**: Custom CLI tool + Docker
- **Monitoring**: Prometheus + Grafana

## Quick Start

```bash
# 1. Configure your credentials
cp config/config.example.yaml config/config.yaml
# Edit config.yaml with your Hetzner API token, affiliate keys, etc.

# 2. Provision Hetzner servers
cd infrastructure/terraform
terraform init && terraform apply

# 3. Configure servers
cd ../ansible
ansible-playbook -i inventory/hosts playbooks/setup-servers.yml

# 4. Deploy stores
cd ../../
node scripts/cli.js deploy --config stores/store-list.csv

# 5. Import products
node scripts/cli.js import-products --all
```

## Directory Structure

```
├── infrastructure/
│   ├── terraform/          # Hetzner server provisioning
│   └── ansible/            # Server configuration
├── app/                    # Next.js store application
├── scripts/                # CLI tools & automation
├── products/               # Product import pipeline
├── config/                 # Configuration files
├── stores/                 # Store definitions (niches, domains)
├── templates/              # Store themes/templates
└── monitoring/             # Prometheus + Grafana configs
```

## Affiliate Networks Supported

- Amazon Associates (Product Advertising API 5.0)
- ShareASale
- CJ Affiliate (Commission Junction)
- Rakuten Advertising
- Impact
- Awin

## Server Requirements

Each Hetzner server (recommended CPX41 or higher):
- 8 vCPUs, 16GB RAM, 240GB SSD
- Runs ~100 stores via Docker containers
- Nginx reverse proxy with SSL
- PostgreSQL database
